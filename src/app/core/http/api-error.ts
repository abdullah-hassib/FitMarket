import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorCategory =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'server'
  | 'network'
  | 'unknown';

export interface NormalizedApiError {
  status: number;
  category: ApiErrorCategory;
  message: string;
  fieldErrors: Record<string, string[]>;
}

const DEFAULT_MESSAGES: Record<ApiErrorCategory, string> = {
  validation: 'Please check the highlighted fields and try again.',
  unauthorized: 'Your session has expired or you are not signed in. Please log in.',
  forbidden: 'You do not have permission to perform this action.',
  not_found: 'The requested record could not be found.',
  server: 'A server error occurred. Please try again shortly.',
  network: 'Unable to reach the server. Check your connection and try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

function extractFieldErrors(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== 'object') return {};
  const rawErrors = (body as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== 'object') return {};

  const result: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(rawErrors)) {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (messages.length > 0) result[field] = messages;
    } else if (typeof value === 'string' && value.trim().length > 0) {
      result[field] = [value];
    }
  }
  return result;
}

function extractBodyMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const msg = (body as { message?: unknown }).message;
  return typeof msg === 'string' && msg.trim().length > 0 ? msg.trim() : null;
}

export function normalizeHttpError(error: unknown): NormalizedApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      category: 'unknown',
      message: error instanceof Error && error.message.trim() ? error.message.trim() : DEFAULT_MESSAGES.unknown,
      fieldErrors: {},
    };
  }

  const fieldErrors = extractFieldErrors(error.error);
  const bodyMessage = extractBodyMessage(error.error);
  const firstFieldMessage = Object.values(fieldErrors)[0]?.[0] ?? null;

  if (error.status === 0) {
    return { status: 0, category: 'network', message: DEFAULT_MESSAGES.network, fieldErrors };
  }
  if (error.status === 400 || error.status === 422) {
    return {
      status: error.status,
      category: 'validation',
      message: firstFieldMessage ?? bodyMessage ?? DEFAULT_MESSAGES.validation,
      fieldErrors,
    };
  }
  if (error.status === 401) {
    return {
      status: 401,
      category: 'unauthorized',
      message: bodyMessage ?? DEFAULT_MESSAGES.unauthorized,
      fieldErrors,
    };
  }
  if (error.status === 403) {
    return {
      status: 403,
      category: 'forbidden',
      message: bodyMessage ?? DEFAULT_MESSAGES.forbidden,
      fieldErrors,
    };
  }
  if (error.status === 404) {
    return {
      status: 404,
      category: 'not_found',
      message: bodyMessage ?? DEFAULT_MESSAGES.not_found,
      fieldErrors,
    };
  }
  if (error.status >= 500) {
    return {
      status: error.status,
      category: 'server',
      message: DEFAULT_MESSAGES.server,
      fieldErrors: {},
    };
  }

  return {
    status: error.status,
    category: 'unknown',
    message: bodyMessage ?? DEFAULT_MESSAGES.unknown,
    fieldErrors,
  };
}
