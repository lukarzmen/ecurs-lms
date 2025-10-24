import { UserResponse } from "@/app/api/user/route";

export type AuthState = 'notAuthorized' | 'userNotExists' | 'userExists';

export const authorizeUser = async (userId: string | null, sessionId: string | null): Promise<{ authState: AuthState, userResponse?: UserResponse }> => {
  console.debug('Authorizing user with ID:', userId, 'and session ID:', sessionId);
  if (!userId || !sessionId) {
    return { authState: 'notAuthorized' };
  }
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.debug('API response status:', response.status);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data: UserResponse = await response.json();

    if (data.exists) {
      return { authState: 'userExists', userResponse: data }; // User exists
    } else {
      return { authState: 'userNotExists' };
    }
  } catch (error) {
    console.error('Authorization error:', error);
    return { authState: 'notAuthorized' };
  }
};
