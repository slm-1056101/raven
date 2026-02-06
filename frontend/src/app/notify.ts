import { toast } from 'sonner';

type NotifyLevel = 'success' | 'error' | 'info';

const TOAST_DURATION_MS = 7000;

function coerceMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (value == null) return '';
  try {
    return String(value);
  } catch {
    return '';
  }
}

export function notify(level: NotifyLevel, title: string, description?: string) {
  const message = coerceMessage(title);
  const desc = description ? coerceMessage(description) : undefined;

  if (level === 'success') {
    toast.success(message, { description: desc, duration: TOAST_DURATION_MS });
    return;
  }

  if (level === 'info') {
    toast(message, { description: desc, duration: TOAST_DURATION_MS });
    return;
  }

  toast.error(message, { description: desc, duration: TOAST_DURATION_MS });
}

export function notifySuccess(title: string, description?: string) {
  notify('success', title, description);
}

export function notifyInfo(title: string, description?: string) {
  notify('info', title, description);
}

export function notifyError(title: string, description?: string) {
  notify('error', title, description);
}

export function notifyApiError(err: unknown, fallbackTitle: string) {
  const message = coerceMessage(err);
  if (!message || message === fallbackTitle) {
    notifyError(fallbackTitle);
    return;
  }
  notifyError(fallbackTitle, message);
}
