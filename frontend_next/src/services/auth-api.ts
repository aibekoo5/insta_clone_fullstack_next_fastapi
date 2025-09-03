
import type {
  UserCreateRequest,
  UserOut,
  LoginRequestData,
  TokenResponse,
  PasswordResetRequestData,
  PasswordResetConfirmData,
  ChangePasswordRequestData,
  ApiError
} from '@/types';
import { getToken, setToken, removeToken, setCurrentUserInStorage, removeCurrentUserFromStorage } from '@/lib/auth-utils';

const API_BASE_URL = 'http://localhost:8000';

const getUrl = (path: string) => `${API_BASE_URL}${path}`;

const handleError = async (response: Response): Promise<ApiError> => {
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && typeof errorData.detail[0] === 'object' && errorData.detail[0].msg) {
        return { detail: errorData.detail.map((err: any) => err.msg).join(', ') };
      }
      return { detail: errorData.detail };
    }
  } catch (e) {
    console.error("Failed to parse error response:", e);
    if (response.statusText) {
      return { detail: response.statusText };
    }
  }
  return { detail: response.statusText || `Request failed with status ${response.status}` };
};


export const registerUser = async (userData: UserCreateRequest): Promise<{ user?: UserOut, error?: ApiError }> => {
  const response = await fetch(getUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const user: UserOut = await response.json();
  return { user };
};

export const loginUser = async (loginData: LoginRequestData): Promise<{ token?: TokenResponse, user?: UserOut, error?: ApiError }> => {
  const response = await fetch(getUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData),
  });

  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const tokenResponse: TokenResponse = await response.json();
  setToken(tokenResponse.access_token);

  const profileResponse = await getMyProfile();
  if (profileResponse.user) {
    setCurrentUserInStorage(profileResponse.user);
    return { token: tokenResponse, user: profileResponse.user };
  } else {
    console.error("Login successful, but failed to fetch user profile.", profileResponse.error);
    return { token: tokenResponse, error: profileResponse.error || { detail: "Failed to fetch profile after login."} };
  }
};


export const logoutUser = async (): Promise<{ message?: string, error?: ApiError }> => {
  const token = getToken();
  removeToken();
  removeCurrentUserFromStorage();

  const newHeaders = new Headers();
  newHeaders.set('Content-Type', 'application/json');
  if (token) {
    newHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getUrl('/auth/logout'), {
    method: 'POST',
    headers: newHeaders
  });

  if (!response.ok) {
    console.warn("Logout API call failed, but client-side tokens cleared.");
  }
  return { message: "Logged out" };
};

export const requestPasswordReset = async (data: PasswordResetRequestData): Promise<{ message?: string, error?: ApiError }> => {
  const response = await fetch(getUrl('/auth/forgot-password/request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const result: { message: string } = await response.json();
  return { message: result.message };
};

export const confirmPasswordReset = async (data: PasswordResetConfirmData): Promise<{ message?: string, error?: ApiError }> => {
  const response = await fetch(getUrl('/auth/reset-password/confirm'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const result: { message: string } = await response.json();
  return { message: result.message };
};


export const getMyProfile = async (): Promise<{ user?: UserOut, error?: ApiError }> => {
  const token = getToken();
  if (!token) return { error: { detail: "No token found" } };

  const newHeaders = new Headers();
  newHeaders.set('Authorization', `Bearer ${token}`);
  
  const response = await fetch(getUrl('/profile/me'), {
    headers: newHeaders
  });
  if (!response.ok) {
    if (response.status === 401) { removeToken(); removeCurrentUserFromStorage(); }
    return { error: await handleError(response) };
  }
  const user: UserOut = await response.json();
  return { user };
};

export const getUserProfileByUsername = async (username: string): Promise<{ user?: UserOut, error?: ApiError }> => {
  const token = getToken();
  const newHeaders = new Headers();
  newHeaders.set('Content-Type', 'application/json');
  if (token) {
    newHeaders.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(getUrl(`/profile/${username}`), { headers: newHeaders });

  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const user: UserOut = await response.json();
  return { user };
};

export const updateMyProfile = async (userId: number, formData: FormData): Promise<{ user?: UserOut, error?: ApiError }> => {
  const token = getToken();
  if (!token) return { error: { detail: "Authentication required" } };

  const newHeaders = new Headers();
  if (token) {
    newHeaders.append('Authorization', `Bearer ${token}`);
  }


  const response = await fetch(getUrl(`/profile/${userId}`), {
    method: 'PUT',
    headers: newHeaders,
    body: formData,
  });

  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const user: UserOut = await response.json();
  setCurrentUserInStorage(user); 
  return { user };
};

export const changeMyPassword = async (data: ChangePasswordRequestData): Promise<{ message?: string, error?: ApiError }> => {
  const token = getToken();
  if (!token) return { error: { detail: "Authentication required" } };

  const newHeaders = new Headers();
  newHeaders.set('Content-Type', 'application/json');
  newHeaders.set('Authorization', `Bearer ${token}`);

  const response = await fetch(getUrl('/profile/change-password'), {
    method: 'PUT',
    headers: newHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return { error: await handleError(response) };
  }
  const result: { detail: string } = await response.json();
  return { message: result.detail };
};
