import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJitForm, submitForm, JitFormError } from '../src';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
  mockFetchNotFound,
  mockFetchNetworkError,
  mockFetchServerError,
} from './helpers';

describe('submitForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('sends POST request to correct URL', async () => {
    await submitForm({ formHash: 'abc123' }, { name: 'John' });

    expect(fetch).toHaveBeenCalledWith(
      'https://jitforms.com/f/abc123',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('uses custom base URL', async () => {
    await submitForm({ formHash: 'abc123', baseUrl: 'https://custom.example.com' }, {});

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.example.com/f/abc123',
      expect.anything(),
    );
  });

  it('strips trailing slash from base URL', async () => {
    await submitForm({ formHash: 'abc123', baseUrl: 'https://custom.example.com/' }, {});

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.example.com/f/abc123',
      expect.anything(),
    );
  });

  it('sends JSON body by default', async () => {
    await submitForm({ formHash: 'abc123' }, { name: 'John', age: 30 });

    const call = vi.mocked(fetch).mock.calls[0];
    const options = call[1]!;

    expect(options.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    );
    expect(JSON.parse(options.body as string)).toEqual({ name: 'John', age: 30 });
  });

  it('sends FormData when data contains File', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await submitForm({ formHash: 'abc123' }, { name: 'John', document: file });

    const call = vi.mocked(fetch).mock.calls[0];
    const options = call[1]!;
    const body = options.body as FormData;

    expect(body).toBeInstanceOf(FormData);
    expect(body.get('name')).toBe('John');
    expect(body.get('document')).toBeInstanceOf(File);
  });

  it('omits null and undefined values from JSON body', async () => {
    await submitForm({ formHash: 'abc123' }, { name: 'John', extra: null, other: undefined });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).toEqual({ name: 'John' });
  });

  it('returns success result on 201', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const result = await submitForm({ formHash: 'abc123' }, { name: 'John' });

    expect(result).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: 'https://example.com/thanks',
    });
  });

  it('returns success without redirect_url', async () => {
    const result = await submitForm({ formHash: 'abc123' }, { name: 'John' });

    expect(result).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: undefined,
    });
  });

  it('returns error result on 422 validation error', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'], name: ['Too short'] }));

    const result = await submitForm({ formHash: 'abc123' }, {});

    expect(result).toEqual({
      ok: false,
      status: 422,
      message: 'Validation failed',
      errors: { email: ['Required'], name: ['Too short'] },
    });
  });

  it('returns error result on 404', async () => {
    vi.stubGlobal('fetch', mockFetchNotFound());

    const result = await submitForm({ formHash: 'invalid' }, {});

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: 'Request failed with status 404',
      errors: {},
    });
  });

  it('returns error result on 500', async () => {
    vi.stubGlobal('fetch', mockFetchServerError());

    const result = await submitForm({ formHash: 'abc123' }, {});

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: 'Request failed with status 500',
      errors: {},
    });
  });

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());

    await expect(submitForm({ formHash: 'abc123' }, {})).rejects.toThrow('Failed to fetch');
  });

  it('includes Accept: application/json header', async () => {
    await submitForm({ formHash: 'abc123' }, {});

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]!.headers).toEqual(expect.objectContaining({ Accept: 'application/json' }));
  });

  it('merges custom headers', async () => {
    await submitForm(
      { formHash: 'abc123', headers: { 'X-Custom': 'value' } },
      {},
    );

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]!.headers).toEqual(
      expect.objectContaining({ Accept: 'application/json', 'X-Custom': 'value' }),
    );
  });

  it('passes AbortSignal for timeout', async () => {
    await submitForm({ formHash: 'abc123', timeout: 5000 }, {});

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]!.signal).toBeInstanceOf(AbortSignal);
  });

  it('throws JitFormError on abort/timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      return new Promise((_, reject) => {
        opts.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    }));

    await expect(
      submitForm({ formHash: 'abc123', timeout: 1 }, {}),
    ).rejects.toThrow(JitFormError);
  });
});

describe('honeypot', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('adds default _honeypot field when honeypot=true', async () => {
    await submitForm({ formHash: 'abc123', honeypot: true }, { name: 'John' });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).toEqual({ name: 'John', _honeypot: '' });
  });

  it('adds custom honeypot field name', async () => {
    await submitForm({ formHash: 'abc123', honeypot: 'trap_field' }, { name: 'John' });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).toEqual({ name: 'John', trap_field: '' });
  });

  it('does not add honeypot when disabled', async () => {
    await submitForm({ formHash: 'abc123' }, { name: 'John' });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).toEqual({ name: 'John' });
    expect(body).not.toHaveProperty('_honeypot');
  });
});

describe('captcha', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('adds captcha_token field when provided', async () => {
    await submitForm(
      { formHash: 'abc123', captchaToken: 'token123' },
      { name: 'John' },
    );

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).toEqual({ name: 'John', captcha_token: 'token123' });
  });

  it('does not add captcha_token when not provided', async () => {
    await submitForm({ formHash: 'abc123' }, { name: 'John' });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).not.toHaveProperty('captcha_token');
  });
});

describe('createJitForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('returns object with submit method', () => {
    const form = createJitForm({ formHash: 'abc123' });

    expect(form).toHaveProperty('submit');
    expect(typeof form.submit).toBe('function');
  });

  it('submit delegates to submitForm', async () => {
    const form = createJitForm({ formHash: 'abc123', baseUrl: 'https://custom.test' });

    await form.submit({ email: 'test@test.com' });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('submit with empty data', async () => {
    const form = createJitForm({ formHash: 'abc123' });

    const result = await form.submit();

    expect(result.ok).toBe(true);
  });
});

describe('JitFormError', () => {
  it('creates error with correct properties', () => {
    const error = new JitFormError('Timeout', 0, {});

    expect(error.message).toBe('Timeout');
    expect(error.status).toBe(0);
    expect(error.errors).toEqual({});
    expect(error.name).toBe('JitFormError');
    expect(error).toBeInstanceOf(Error);
  });

  it('defaults errors to empty object', () => {
    const error = new JitFormError('Error', 500);

    expect(error.errors).toEqual({});
  });
});
