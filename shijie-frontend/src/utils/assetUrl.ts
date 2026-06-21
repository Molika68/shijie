declare const API_BASE_URL: string;

/** 将 /uploads/... 转为完整 URL */
export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

export function displayEmail(email?: string): string {
  if (!email) return '旅行者';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const masked = name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***`;
  return `${masked}@${domain}`;
}
