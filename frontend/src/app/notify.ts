import { toast } from 'sonner';

type NotifyLevel = 'success' | 'error' | 'info';

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
    toast.success(message, { description: desc, duration: 3500 });
    return;
  }

  if (level === 'info') {
    toast(message, { description: desc, duration: 3500 });
    return;
  }

  toast.error(message, { description: desc, duration: 4500 });
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
