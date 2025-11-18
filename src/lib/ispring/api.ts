interface ISpringTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ISpringUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fields: Array<{
    name: string;
    value: string;
  }>;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getISpringToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const response = await fetch(
    `https://${process.env.ISPRING_DOMAIN}/api/v3/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.ISPRING_CLIENT_ID!,
        client_secret: process.env.ISPRING_CLIENT_SECRET!,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get iSpring token');
  }

  const data: ISpringTokenResponse = await response.json();

  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function getISpringUsers(): Promise<ISpringUser[]> {
  const token = await getISpringToken();
  const allUsers: ISpringUser[] = [];
  let pageNumber = 1;
  const pageSize = 1000;

  while (true) {
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
      throw new Error('Failed to fetch iSpring users');
    }

    const data = await response.json();
    const users = data.userProfiles || [];

    allUsers.push(...users);

    if (users.length < pageSize) break;
    pageNumber++;
  }

  return allUsers;
}

export async function getUserPoints(userId: string): Promise<number> {
  const token = await getISpringToken();

  const response = await fetch(
    `https://${process.env.ISPRING_API_DOMAIN}/gamification/points?userIds=${userId}`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get user points');
  }

  const xml = await response.text();
  const pointsMatch = xml.match(/<points>(\d+)<\/points>/);

  return pointsMatch ? parseInt(pointsMatch[1], 10) : 0;
}

export async function withdrawPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> {
  const token = await getISpringToken();

  const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
        <withdrawGamificationPoints>
        <userId>${userId}</userId>
        <amount>${amount}</amount>
        <reason>${reason}</reason>
        </withdrawGamificationPoints>
    `;

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
