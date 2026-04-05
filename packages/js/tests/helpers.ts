import { vi } from 'vitest';
import type { JitFormSubmission } from '../src/types';

export const MOCK_SUBMISSION: JitFormSubmission = {
  id: 'sub_123',
  data: { name: 'John', email: 'john@example.com' },
  ip_address: '127.0.0.1',
  user_agent: 'vitest',
  referrer: null,
  is_spam: false,
  spam_score: 0,
  is_read: false,
  created_at: '2026-04-02T10:00:00Z',
};

export function mockFetchSuccess(submission = MOCK_SUBMISSION, redirectUrl?: string) {
  return vi.fn().mockResolvedValue({
    status: 201,
    json: () => Promise.resolve({ data: submission, redirect_url: redirectUrl }),
  });
}

export function mockFetchValidationError(errors: Record<string, string[]> = { email: ['The email field is required.'] }) {
  return vi.fn().mockResolvedValue({
    status: 422,
    json: () => Promise.resolve({ message: 'Validation failed', errors }),
  });
}

export function mockFetchNotFound() {
  return vi.fn().mockResolvedValue({
    status: 404,
    json: () => Promise.resolve({ message: 'Not found' }),
  });
}

export function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

export function mockFetchTimeout() {
  return vi.fn().mockImplementation(() => new Promise((_, reject) => {
    const error = new DOMException('The operation was aborted.', 'AbortError');
    setTimeout(() => reject(error), 0);
  }));
}

export function mockFetchServerError() {
  return vi.fn().mockResolvedValue({
    status: 500,
    json: () => Promise.resolve({ message: 'Internal server error' }),
  });
}
