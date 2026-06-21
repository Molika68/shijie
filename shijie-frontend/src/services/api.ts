import Taro from '@tarojs/taro';

declare const API_BASE_URL: string;

export interface ApiResponse<T> {
  code: number;
  data: T;
}

export interface RecognitionResult {
  object: string;
  description: string;
  english: string;
  mock?: boolean;
}

export interface HistoryItem {
  id: string;
  type: 'RECOGNITION' | 'GENERATION';
  inputText?: string;
  inputImage?: string;
  outputText?: string;
  outputImage?: string;
  recognition?: RecognitionResult;
  createdAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}

const TOKEN_KEY = 'shijie_token';
const REFRESH_KEY = 'shijie_refresh';
const USER_KEY = 'shijie_user';

export function getToken(): string {
  return Taro.getStorageSync(TOKEN_KEY) || '';
}

export function getRefreshToken(): string {
  return Taro.getStorageSync(REFRESH_KEY) || '';
}

export function setAuth(token: string, user: AuthUser, refreshToken?: string) {
  Taro.setStorageSync(TOKEN_KEY, token);
  Taro.setStorageSync(USER_KEY, user);
  if (refreshToken) {
    Taro.setStorageSync(REFRESH_KEY, refreshToken);
  }
}

export function getUser(): AuthUser | null {
  return Taro.getStorageSync(USER_KEY) || null;
}

export function clearAuth() {
  Taro.removeStorageSync(TOKEN_KEY);
  Taro.removeStorageSync(REFRESH_KEY);
  Taro.removeStorageSync(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(
  url: string,
  options: Taro.request.Option = {},
): Promise<ApiResponse<T>> {
  const token = getToken();
  const header: Record<string, string> = {
    ...(options.header as Record<string, string>),
  };
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  const res = await Taro.request({
    url: `${API_BASE_URL}${url}`,
    ...options,
    header,
  });

  if (res.statusCode === 401) {
    clearAuth();
    throw new Error('登录已过期，请重新登录');
  }

  if (res.statusCode >= 400) {
    const msg = (res.data as { message?: string })?.message || '请求失败';
    throw new Error(msg);
  }

  return res.data as ApiResponse<T>;
}

export async function getAppConfig() {
  return request<{
    aiProvider: string;
    aiMock: boolean;
    hint?: string;
  }>('/config');
}

export async function sendCode(email: string) {
  return request<{ message: string; devCode?: string }>('/auth/send-code', {
    method: 'POST',
    data: { email },
    header: { 'Content-Type': 'application/json' },
  });
}

export async function login(email: string, code: string) {
  return request<{ userId: string; email: string; token: string; refreshToken: string }>(
    '/auth/login',
    {
      method: 'POST',
      data: { email, code },
      header: { 'Content-Type': 'application/json' },
    },
  );
}

export async function logout() {
  try {
    await request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  } finally {
    clearAuth();
  }
}

export async function recognizeImage(filePath: string) {
  return new Promise<ApiResponse<RecognitionResult>>((resolve, reject) => {
    const token = getToken();
    Taro.uploadFile({
      url: `${API_BASE_URL}/vision/recognize`,
      filePath,
      name: 'image',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode === 401) {
          clearAuth();
          reject(new Error('登录已过期，请重新登录'));
          return;
        }
        try {
          resolve(JSON.parse(res.data));
        } catch {
          reject(new Error('解析响应失败'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败')),
    });
  });
}

export async function textToImage(prompt: string) {
  return request<{ imageUrl: string }>('/generation/text-to-image', {
    method: 'POST',
    data: { prompt },
    header: { 'Content-Type': 'application/json' },
  });
}

export async function getHistory(page = 1, size = 20, type?: string) {
  const query = `?page=${page}&size=${size}${type ? `&type=${type}` : ''}`;
  return request<{
    items: HistoryItem[];
    total: number;
    page: number;
    size: number;
  }>(`/history${query}`);
}

export async function getHistoryDetail(id: string) {
  return request<HistoryItem>(`/history/${id}`);
}

export async function deleteHistory(id: string) {
  return request<{ success: boolean }>(`/history/${id}`, { method: 'DELETE' });
}

export async function speakText(text: string) {
  return request<{ audioUrl?: string; mock?: boolean; message?: string; text: string }>(
    '/tts/speak',
    {
      method: 'POST',
      data: { text },
      header: { 'Content-Type': 'application/json' },
    },
  );
}
