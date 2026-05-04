// lib/ispring/api.ts

import { createClient } from '@/lib/supabase/server';

interface ISpringTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ISpringField {
  name: string;
  value: string;
}

interface ISpringUser {
  userId: string;
  fields: ISpringField | ISpringField[];
}

interface ISpringUsersResponse {
  userProfiles: ISpringUser | ISpringUser[];
  totalUsersNumber: number;
}

// Кэш токена — в памяти Lambda достаточно
let tokenCache: { token: string; expiresAt: number } | null = null;

// Кэш юзеров — в памяти как быстрый слой поверх Supabase
let memUsersCache: { users: ISpringUser[]; expiresAt: number } | null = null;

const USERS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут
const ISPRING_FETCH_TIMEOUT_MS = 8000; // 8 секунд на каждый запрос

// Обёртка над fetch с AbortController — больше не зависаем на 70 секунд
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = ISPRING_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getISpringToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && tokenCache.expiresAt > now) {
    console.log('✅ Using cached iSpring token');
    return tokenCache.token;
  }

  console.log('🔑 Requesting new iSpring token...');

  if (
    !process.env.ISPRING_DOMAIN ||
    !process.env.ISPRING_CLIENT_ID ||
    !process.env.ISPRING_CLIENT_SECRET
  ) {
    throw new Error('Missing iSpring credentials in environment variables');
  }

  const url = `https://${process.env.ISPRING_DOMAIN}/api/v3/token`;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.ISPRING_CLIENT_ID,
    client_secret: process.env.ISPRING_CLIENT_SECRET,
  });

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ iSpring token error response:', errorText);
    throw new Error(
      `Failed to get iSpring token (${response.status}): ${errorText}`
    );
  }

  const data: ISpringTokenResponse = await response.json();
  console.log('✅ Successfully got iSpring token');

  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

async function loadUsersFromSupabase(): Promise<ISpringUser[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ispring_cache')
      .select('data, updated_at')
      .eq('key', 'users')
      .single();

    if (error || !data) {
      console.log('📭 No users cache in Supabase');
      return null;
    }

    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > USERS_CACHE_TTL_MS) {
      console.log(`⏰ Supabase cache expired (${Math.round(age / 1000)}s old)`);
      return null;
    }

    const users = data.data as ISpringUser[];
    console.log(`✅ Loaded ${users.length} users from Supabase cache`);
    return users;
  } catch (err) {
    console.error('❌ Error reading Supabase cache:', err);
    return null;
  }
}

async function saveUsersToSupabase(users: ISpringUser[]): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('ispring_cache')
      .upsert({
        key: 'users',
        data: users,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Error saving to Supabase cache:', error);
    } else {
      console.log(`💾 Saved ${users.length} users to Supabase cache`);
    }
  } catch (err) {
    console.error('❌ Exception saving to Supabase cache:', err);
  }
}

async function fetchAllUsersFromISpring(): Promise<ISpringUser[]> {
  const token = await getISpringToken();
  const allUsers: ISpringUser[] = [];
  let pageNumber = 1;
  const pageSize = 1000;

  console.log('📥 Fetching iSpring users...');

  while (true) {
    console.log(`Fetching page ${pageNumber}...`);

    const response = await fetchWithTimeout(
      `https://${process.env.ISPRING_API_DOMAIN}/api/v2/user/list`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ page: pageNumber, pageSize }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ iSpring users error:', errorText);
      throw new Error(
        `Failed to fetch iSpring users (${response.status}): ${errorText}`
      );
    }

    const data: ISpringUsersResponse = await response.json();

    let users: ISpringUser[];
    if (Array.isArray(data.userProfiles)) {
      users = data.userProfiles;
    } else if (data.userProfiles) {
      users = [data.userProfiles];
    } else {
      users = [];
    }

    allUsers.push(...users);
    console.log(`✅ Fetched ${users.length} users, total: ${allUsers.length}`);

    if (users.length < pageSize) break;
    pageNumber++;
  }

  return allUsers;
}

export async function getISpringUsers(): Promise<ISpringUser[]> {
  const now = Date.now();

  // 1. Проверяем кэш в памяти Lambda (самый быстрый)
  if (memUsersCache && memUsersCache.expiresAt > now) {
    console.log(
      `✅ Using in-memory users cache (${memUsersCache.users.length})`
    );
    return memUsersCache.users;
  }

  // 2. Проверяем кэш в Supabase (быстро ~100ms, переживёт cold start)
  const cachedUsers = await loadUsersFromSupabase();
  if (cachedUsers) {
    memUsersCache = { users: cachedUsers, expiresAt: now + USERS_CACHE_TTL_MS };
    return cachedUsers;
  }

  // 3. Идём в iSpring (медленно, только если оба кэша пустые/устаревшие)
  console.log('🌐 Fetching fresh users from iSpring...');
  const users = await fetchAllUsersFromISpring();

  // Сохраняем в оба кэша
  memUsersCache = { users, expiresAt: now + USERS_CACHE_TTL_MS };
  await saveUsersToSupabase(users);

  return users;
}

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const token = await getISpringToken();

    console.log('💰 Getting points for user:', userId);

    const response = await fetchWithTimeout(
      `https://api-${process.env.ISPRING_API_DOMAIN}/gamification/points?userIds=${userId}`,
      {
        headers: {
          Authorization: token, // Без "Bearer"!
          Accept: 'application/xml',
        },
      }
    );

    console.log('Points response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get user points:', errorText);
      return 0;
    }

    const xml = await response.text();
    console.log(
      'Points XML response (first 200 chars):',
      xml.substring(0, 200)
    );

    const pointsMatch = xml.match(/<points>(\d+)<\/points>/);
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

    console.log('✅ User points:', points);
    return points;
  } catch (error) {
    console.error('❌ Error getting user points:', error);
    return 0;
  }
}

export async function withdrawPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> {
  try {
    const token = await getISpringToken();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<withdrawGamificationPoints>
  <userId>${userId}</userId>
  <amount>${amount}</amount>
  <reason>${reason}</reason>
</withdrawGamificationPoints>`;

    console.log('💸 Withdrawing points:', { userId, amount, reason });

    const response = await fetchWithTimeout(
      `https://api-${process.env.ISPRING_API_DOMAIN}/gamification/points/withdraw`,
      {
        method: 'POST',
        headers: {
          Authorization: token, // Без "Bearer"!
          'Content-Type': 'application/xml',
          Accept: 'application/xml',
        },
        body: xml,
      }
    );

    console.log('Withdraw response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to withdraw points:', errorText);
      return false;
    }

    console.log('✅ Points withdrawn successfully');
    return true;
  } catch (error) {
    console.error('❌ Error withdrawing points:', error);
    return false;
  }
}
