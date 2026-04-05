import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJitForm } from '../src/use-jit-form';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
  mockFetchServerError,
  mockFetchNetworkError,
} from '../../js/tests/helpers';

describe('useJitForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useJitForm('abc123'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.submission).toBeNull();
    expect(result.current.redirectUrl).toBeUndefined();
    expect(result.current.fieldErrors).toEqual({});
  });

  it('sets isLoading during submission', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const { result } = renderHook(() => useJitForm('abc123'));

    let submitPromise: Promise<unknown>;
    act(() => {
      submitPromise = result.current.submit({ name: 'John' });
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    await act(async () => {
      resolvePromise!({
        status: 201,
        json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
      } as Response);
      await submitPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets success state on 201', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({ name: 'John' });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.submission).toEqual(MOCK_SUBMISSION);
    expect(result.current.redirectUrl).toBe('https://example.com/thanks');
    expect(result.current.error).toBeNull();
  });

  it('sets error state on 422', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({ name: 'John' });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual({
      message: 'Validation failed',
      errors: { email: ['Required'] },
    });
    expect(result.current.submission).toBeNull();
  });

  it('exposes fieldErrors from error', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'], name: ['Too short'] }));

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({});
    });

    expect(result.current.fieldErrors).toEqual({
      email: ['Required'],
      name: ['Too short'],
    });
  });

  it('fieldError returns first error for a field', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({
      email: ['Required', 'Must be valid email'],
    }));

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({});
    });

    expect(result.current.fieldError('email')).toBe('Required');
    expect(result.current.fieldError('name')).toBeUndefined();
  });

  it('fieldErrors is empty object when no error', () => {
    const { result } = renderHook(() => useJitForm('abc123'));

    expect(result.current.fieldErrors).toEqual({});
  });

  it('reset clears all state', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess());

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({ name: 'John' });
    });

    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.submission).toBeNull();
    expect(result.current.redirectUrl).toBeUndefined();
  });

  it('handles server error', async () => {
    vi.stubGlobal('fetch', mockFetchServerError());

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({});
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe('Request failed with status 500');
  });

  it('passes options to client', async () => {
    const { result } = renderHook(() =>
      useJitForm('abc123', { baseUrl: 'https://custom.test', honeypot: true }),
    );

    await act(async () => {
      await result.current.submit({ name: 'John' });
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('returns the result from submit', async () => {
    const { result } = renderHook(() => useJitForm('abc123'));

    let submitResult: unknown;
    await act(async () => {
      submitResult = await result.current.submit({ name: 'John' });
    });

    expect(submitResult).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: undefined,
    });
  });

  it('clears previous error on new submission', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const { result } = renderHook(() => useJitForm('abc123'));

    await act(async () => {
      await result.current.submit({});
    });

    expect(result.current.isError).toBe(true);

    vi.stubGlobal('fetch', mockFetchSuccess());

    await act(async () => {
      await result.current.submit({ email: 'test@test.com' });
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
