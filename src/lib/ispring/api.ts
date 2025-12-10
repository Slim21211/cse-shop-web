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

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getISpringToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && tokenCache.expiresAt > now) {
    console.log('✅ Using cached iSpring token');
    return tokenCache.token;
  }

  // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ
  console.log('🔑 Requesting new iSpring token...');
  console.log('ISPRING_DOMAIN:', process.env.ISPRING_DOMAIN);
  console.log(
    'ISPRING_CLIENT_ID:',
    process.env.ISPRING_CLIENT_ID ? '✅ Set' : '❌ NOT SET'
  );
  console.log(
    'ISPRING_CLIENT_SECRET:',
    process.env.ISPRING_CLIENT_SECRET ? '✅ Set' : '❌ NOT SET'
  );

  if (
    !process.env.ISPRING_DOMAIN ||
    !process.env.ISPRING_CLIENT_ID ||
    !process.env.ISPRING_CLIENT_SECRET
  ) {
    throw new Error('Missing iSpring credentials in environment variables');
  }

  const url = `https://${process.env.ISPRING_DOMAIN}/api/v3/token`;
  console.log('Request URL:', url);

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.ISPRING_CLIENT_ID,
    client_secret: process.env.ISPRING_CLIENT_SECRET,
  });

  console.log('Request body:', {
    grant_type: 'client_credentials',
    client_id: process.env.ISPRING_CLIENT_ID.substring(0, 8) + '...',
    client_secret: '***',
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    console.log('Response status:', response.status);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries())
    );

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
  } catch (error) {
    console.error('❌ Exception while getting iSpring token:', error);
    throw error;
  }
}

export async function getISpringUsers(): Promise<ISpringUser[]> {
  const token = await getISpringToken();
  const allUsers: ISpringUser[] = [];
  let pageNumber = 1;
  const pageSize = 1000;

  console.log('📥 Fetching iSpring users...');

  while (true) {
    console.log(`Fetching page ${pageNumber}...`);

    const response = await fetch(
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

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const token = await getISpringToken();

    console.log('💰 Getting points for user:', userId);

    // ИСПРАВЛЕНИЕ: Правильный URL и заголовки
    const response = await fetch(
      `https://${process.env.ISPRING_API_DOMAIN}/gamification/points?userIds=${userId}`,
      {
        headers: {
          Authorization: token, // Без "Bearer"
          Accept: 'application/xml',
        },
      }
    );

    console.log('Points response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get user points:', errorText);
      return 0; // Возвращаем 0 вместо ошибки
    }

    const xml = await response.text();
    console.log('Points XML response:', xml.substring(0, 200));

    const pointsMatch = xml.match(/<points>(\d+)<\/points>/);
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

    console.log('✅ User points:', points);
    return points;
  } catch (error) {
    console.error('❌ Error getting user points:', error);
    return 0; // Возвращаем 0 при любой ошибке
  }
}

export async function withdrawPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> {
  const token = await getISpringToken();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<withdrawGamificationPoints>
  <userId>${userId}</userId>
  <amount>${amount}</amount>
  <reason>${reason}</reason>
</withdrawGamificationPoints>`;

  const response = await fetch(
    `https://${process.env.ISPRING_API_DOMAIN}/gamification/points/withdraw`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/xml',
        Accept: 'application/xml',
      },
      body: xml,
    }
  );

  return response.ok;
}
