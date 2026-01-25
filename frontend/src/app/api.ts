export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;

  const nextHeaders = new Headers(headers);
  if (token) {
    nextHeaders.set('Authorization', `Bearer ${token}`);
  }
  if (!nextHeaders.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, { ...rest, headers: nextHeaders });
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        const data: any = await res.json();

        const firstFieldError = (value: any): string | null => {
          if (!value || typeof value !== 'object') return null;
          for (const key of Object.keys(value)) {
            const v = (value as any)[key];
            if (typeof v === 'string' && v) return v;
            if (Array.isArray(v) && v.length > 0) {
              const first = v[0];
              if (typeof first === 'string' && first) return first;
            }
          }
          return null;
        };

        const message =
          (typeof data?.detail === 'string' && data.detail) ||
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
          firstFieldError(data) ||
          (typeof data === 'string' && data);

        if (message) {
          throw new Error(message);
        }

        throw new Error(`Request failed: ${res.status}`);
      }

      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    } catch (err: any) {
      if (err instanceof Error) throw err;
      throw new Error(`Request failed: ${res.status}`);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
