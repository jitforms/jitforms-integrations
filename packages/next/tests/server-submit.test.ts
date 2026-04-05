import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serverSubmitForm } from '../src/server-submit';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
  mockFetchServerError,
} from '../../js/tests/helpers';

describe('serverSubmitForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('submits to default base URL', async () => {
    await serverSubmitForm('abc123', { name: 'John' });

    expect(fetch).toHaveBeenCalledWith(
      'https://jitforms.com/f/abc123',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('uses serverUrl when provided', async () => {
    await serverSubmitForm('abc123', { name: 'John' }, {
      serverUrl: 'http://internal:3000',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://internal:3000/f/abc123',
      expect.anything(),
    );
  });

  it('serverUrl takes precedence over baseUrl', async () => {
    await serverSubmitForm('abc123', { name: 'John' }, {
      baseUrl: 'https://public.com',
      serverUrl: 'http://internal:3000',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://internal:3000/f/abc123',
      expect.anything(),
    );
  });

  it('falls back to baseUrl when no serverUrl', async () => {
    await serverSubmitForm('abc123', { name: 'John' }, {
      baseUrl: 'https://custom.com',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.com/f/abc123',
      expect.anything(),
    );
  });

  it('returns success result on 201', async () => {
    const result = await serverSubmitForm('abc123', { name: 'John' });

    expect(result).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: undefined,
    });
  });

  it('returns error result on 422', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const result = await serverSubmitForm('abc123', {});

    expect(result).toEqual({
      ok: false,
      status: 422,
      message: 'Validation failed',
      errors: { email: ['Required'] },
    });
  });

  it('returns error result on 500', async () => {
    vi.stubGlobal('fetch', mockFetchServerError());

    const result = await serverSubmitForm('abc123', {});

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: 'Request failed with status 500',
      errors: {},
    });
  });

  it('passes additional config options', async () => {
    await serverSubmitForm('abc123', { name: 'John' }, {
      honeypot: true,
      captchaToken: 'token123',
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body._honeypot).toBe('');
    expect(body.captcha_token).toBe('token123');
  });

  it('works with no options', async () => {
    const result = await serverSubmitForm('abc123', { email: 'test@test.com' });

    expect(result.ok).toBe(true);
  });
});
