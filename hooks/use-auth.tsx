type AuthState = 'notAuthorized' | 'userNotExists' | 'userExists';

interface UserResponse {
  exists: boolean;
}

export const authorizeUser = async (userId: string | null, sessionId: string | null): Promise<AuthState> => {
  if (!userId || !sessionId) {
    return 'notAuthorized';
  }

  try {
    const response = await fetch(`${process.env.URL}/api/user?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: {
      'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data: UserResponse = await response.json();

    if (data.exists) {
      return 'userExists'; // User exists
    } else {
      return 'userNotExists';
    }
  } catch (error) {
    console.error('Authorization error:', error);
    return 'notAuthorized';
  }
};
