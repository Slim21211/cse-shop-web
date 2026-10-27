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

// Без таймаута зависший iSpring подвешивает рендер layout и оформление заказа
const REQUEST_TIMEOUT_MS = 8000;

let tokenCache: { token: string; expiresAt: number } | null = null;
let tokenRequest: Promise<string> | null = null;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function requestToken(): Promise<string> {
  if (
    !process.env.ISPRING_DOMAIN ||
    !process.env.ISPRING_CLIENT_ID ||
    !process.env.ISPRING_CLIENT_SECRET
  ) {
    throw new Error('Missing iSpring credentials in environment variables');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.ISPRING_CLIENT_ID,
    client_secret: process.env.ISPRING_CLIENT_SECRET,
  });

  const response = await fetch(
    `https://${process.env.ISPRING_DOMAIN}/api/v3/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get iSpring token (${response.status}): ${errorText}`
    );
  }

  const data: ISpringTokenResponse = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export async function getISpringToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // Параллельные запросы после истечения токена ждут один общий запрос
  if (!tokenRequest) {
    tokenRequest = requestToken().finally(() => {
      tokenRequest = null;
    });
  }
  return tokenRequest;
}

// Ищет одного пользователя по email через фильтр на стороне iSpring.
// Возвращает null если не найден.
export async function findISpringUserByEmail(
  email: string
): Promise<ISpringUser | null> {
  const token = await getISpringToken();

  const response = await fetch(
    `https://${process.env.ISPRING_API_DOMAIN}/api/v2/user/list`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        pageSize: 1,
        emails: [email.toLowerCase()],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch iSpring user (${response.status}): ${errorText}`
    );
  }

  const data: ISpringUsersResponse = await response.json();

  if (!data.userProfiles) return null;

  const user = Array.isArray(data.userProfiles)
    ? data.userProfiles[0]
    : data.userProfiles;

  return user || null;
}

export function getISpringUserField(user: ISpringUser, name: string): string {
  const fields = Array.isArray(user.fields) ? user.fields : [user.fields];
  return fields.find((f) => f?.name === name)?.value || '';
}

/**
 * Баланс пользователя или null, если iSpring недоступен.
 * Раньше при ошибке возвращался 0 — пользователь видел «0 баллов» вместо ошибки.
 */
export async function getUserPoints(userId: string): Promise<number | null> {
  try {
    const token = await getISpringToken();

    const response = await fetch(
      `https://api-${process.env.ISPRING_API_DOMAIN}/gamification/points?userIds=${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: token, // Без "Bearer"!
          Accept: 'application/xml',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('❌ Failed to get user points:', await response.text());
      return null;
    }

    const xml = await response.text();
    const pointsMatch = xml.match(/<points>(\d+)<\/points>/);
    return pointsMatch ? parseInt(pointsMatch[1], 10) : 0;
  } catch (error) {
    console.error('❌ Error getting user points:', error);
    return null;
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
  <userId>${escapeXml(userId)}</userId>
  <amount>${amount}</amount>
  <reason>${escapeXml(reason)}</reason>
</withdrawGamificationPoints>`;

    const response = await fetch(
      `https://api-${process.env.ISPRING_API_DOMAIN}/gamification/points/withdraw`,
      {
        method: 'POST',
        headers: {
          Authorization: token, // Без "Bearer"!
          'Content-Type': 'application/xml',
          Accept: 'application/xml',
        },
        body: xml,
        // Таймаут больше обычного: оборванный по таймауту, но выполненный iSpring запрос
        // означает списанные баллы без заказа
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      console.error('❌ Failed to withdraw points:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error withdrawing points:', error);
    return false;
  }
}
