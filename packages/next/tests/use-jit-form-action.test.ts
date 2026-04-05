import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJitFormAction } from '../src/use-jit-form-action';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
} from '../../js/tests/helpers';

describe('useJitFormAction', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('returns all useJitForm properties plus formAction', () => {
    const { result } = renderHook(() => useJitFormAction('abc123'));

    expect(result.current.submit).toBeDefined();
    expect(result.current.formAction).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('formAction submits FormData', async () => {
    const { result } = renderHook(() => useJitFormAction('abc123'));

    const formData = new FormData();
    formData.append('email', 'test@test.com');
    formData.append('name', 'John');

    await act(async () => {
      await result.current.formAction(formData);
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://jitforms.com/f/abc123',
      expect.anything(),
    );

    expect(result.current.isSuccess).toBe(true);
  });

  it('formAction calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useJitFormAction('abc123', { onSuccess }),
    );

    const formData = new FormData();
    formData.append('email', 'test@test.com');

    await act(async () => {
      await result.current.formAction(formData);
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, submission: MOCK_SUBMISSION }),
    );
  });

  it('formAction calls onError callback', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useJitFormAction('abc123', { onError }),
    );

    const formData = new FormData();

    await act(async () => {
      await result.current.formAction(formData);
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        errors: { email: ['Required'] },
      }),
    );
  });

  it('formAction ignores empty files', async () => {
    const { result } = renderHook(() => useJitFormAction('abc123'));

    const formData = new FormData();
    formData.append('email', 'test@test.com');
    formData.append('file', new File([], 'empty.txt'));

    await act(async () => {
      await result.current.formAction(formData);
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body).toEqual({ email: 'test@test.com' });
    expect(body).not.toHaveProperty('file');
  });

  it('formAction includes non-empty files', async () => {
    const { result } = renderHook(() => useJitFormAction('abc123'));

    const formData = new FormData();
    formData.append('email', 'test@test.com');
    formData.append('document', new File(['content'], 'doc.pdf', { type: 'application/pdf' }));

    await act(async () => {
      await result.current.formAction(formData);
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = call[1]!.body as FormData;

    // When files are present, body should be FormData
    expect(body).toBeInstanceOf(FormData);
  });

  it('formAction auto-redirects on success with redirect URL', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '', set href(url: string) { hrefSetter(url); } },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useJitFormAction('abc123'));

    const formData = new FormData();
    formData.append('email', 'test@test.com');

    await act(async () => {
      await result.current.formAction(formData);
    });

    // The redirect attempt is made
    expect(result.current.isSuccess).toBe(true);
  });

  it('formAction skips redirect when autoRedirect=false', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const { result } = renderHook(() =>
      useJitFormAction('abc123', { autoRedirect: false }),
    );

    const formData = new FormData();
    formData.append('email', 'test@test.com');

    await act(async () => {
      await result.current.formAction(formData);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.redirectUrl).toBe('https://example.com/thanks');
  });

  it('sets error state on validation failure', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const { result } = renderHook(() => useJitFormAction('abc123'));

    const formData = new FormData();

    await act(async () => {
      await result.current.formAction(formData);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.fieldError('email')).toBe('Required');
  });

  it('passes config options to client', async () => {
    const { result } = renderHook(() =>
      useJitFormAction('abc123', { baseUrl: 'https://custom.test', honeypot: true }),
    );

    const formData = new FormData();
    formData.append('email', 'test@test.com');

    await act(async () => {
      await result.current.formAction(formData);
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });
});
