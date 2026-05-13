const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiBaseUrl = rawApiBaseUrl?.replace(/\/+$/, "") ?? "";

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
