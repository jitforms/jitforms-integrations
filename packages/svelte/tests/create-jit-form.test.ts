import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJitForm } from '../src/create-jit-form';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
  mockFetchServerError,
} from '../../js/tests/helpers';

describe('createJitForm (Svelte store)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('returns store with initial state', () => {
    const store = createJitForm('abc123');

    expect(store.isLoading).toBe(false);
    expect(store.isSuccess).toBe(false);
    expect(store.isError).toBe(false);
    expect(store.error).toBeNull();
    expect(store.submission).toBeNull();
    expect(store.redirectUrl).toBeUndefined();
    expect(store.fieldErrors).toEqual({});
  });

  it('has subscribe method for Svelte compatibility', () => {
    const store = createJitForm('abc123');

    expect(typeof store.subscribe).toBe('function');
  });

  it('subscribe receives initial state immediately', () => {
    const store = createJitForm('abc123');
    const callback = vi.fn();

    store.subscribe(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: false,
        isSuccess: false,
        isError: false,
      }),
    );
  });

  it('subscribe returns unsubscribe function', () => {
    const store = createJitForm('abc123');
    const callback = vi.fn();

    const unsubscribe = store.subscribe(callback);

    expect(typeof unsubscribe).toBe('function');
    callback.mockClear();

    unsubscribe();

    // After unsubscribe, callback should not be called on state change
    store.reset();
    expect(callback).not.toHaveBeenCalled();
  });

  it('notifies subscribers on submit - loading state', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const store = createJitForm('abc123');
    const states: boolean[] = [];

    store.subscribe((state) => {
      states.push(state.isLoading);
    });

    const submitPromise = store.submit({ name: 'John' });

    // Should have received: initial (false), loading (true)
    expect(states).toEqual([false, true]);

    resolvePromise!({
      status: 201,
      json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
    } as Response);

    await submitPromise;

    // Should have received: initial (false), loading (true), success (false)
    expect(states).toEqual([false, true, false]);
  });

  it('sets success state on 201', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const store = createJitForm('abc123');
    let latestState: typeof store | null = null;

    store.subscribe((state) => {
      latestState = state;
    });

    await store.submit({ name: 'John' });

    expect(latestState!.isSuccess).toBe(true);
    expect(latestState!.isError).toBe(false);
    expect(latestState!.submission).toEqual(MOCK_SUBMISSION);
    expect(latestState!.redirectUrl).toBe('https://example.com/thanks');
  });

  it('sets error state on 422', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const store = createJitForm('abc123');
    let latestState: typeof store | null = null;

    store.subscribe((state) => {
      latestState = state;
    });

    await store.submit({});

    expect(latestState!.isSuccess).toBe(false);
    expect(latestState!.isError).toBe(true);
    expect(latestState!.error).toEqual({
      message: 'Validation failed',
      errors: { email: ['Required'] },
    });
  });

  it('fieldError returns first error for a field', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({
      email: ['Required', 'Must be valid'],
    }));

    const store = createJitForm('abc123');
    let latestState: typeof store | null = null;

    store.subscribe((state) => {
      latestState = state;
    });

    await store.submit({});

    expect(latestState!.fieldError('email')).toBe('Required');
    expect(latestState!.fieldError('name')).toBeUndefined();
  });

  it('fieldErrors returns all errors', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({
      email: ['Required'],
      name: ['Too short'],
    }));

    const store = createJitForm('abc123');
    let latestState: typeof store | null = null;

    store.subscribe((state) => {
      latestState = state;
    });

    await store.submit({});

    expect(latestState!.fieldErrors).toEqual({
      email: ['Required'],
      name: ['Too short'],
    });
  });

  it('reset clears state and notifies subscribers', async () => {
    const store = createJitForm('abc123');
    let latestState: typeof store | null = null;

    store.subscribe((state) => {
      latestState = state;
    });

    await store.submit({ name: 'John' });

    expect(latestState!.isSuccess).toBe(true);

    store.reset();

    expect(latestState!.isLoading).toBe(false);
    expect(latestState!.isSuccess).toBe(false);
    expect(latestState!.isError).toBe(false);
    expect(latestState!.error).toBeNull();
    expect(latestState!.submission).toBeNull();
  });

  it('accepts full config object', async () => {
    const store = createJitForm({ formHash: 'abc123', baseUrl: 'https://custom.test' });

    await store.submit({ name: 'John' });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('returns result from submit', async () => {
    const store = createJitForm('abc123');

    const result = await store.submit({ name: 'John' });

    expect(result).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: undefined,
    });
  });

  it('handles server error', async () => {
    vi.stubGlobal('fetch', mockFetchServerError());

    const store = createJitForm('abc123');
    let latestState: typeof store | null = null;

    store.subscribe((state) => {
      latestState = state;
    });

    await store.submit({});

    expect(latestState!.isError).toBe(true);
    expect(latestState!.error?.message).toBe('Request failed with status 500');
  });

  it('multiple subscribers receive updates', async () => {
    const store = createJitForm('abc123');
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    store.subscribe(callback1);
    store.subscribe(callback2);

    await store.submit({ name: 'John' });

    // initial + loading + success = 3 calls each
    expect(callback1).toHaveBeenCalledTimes(3);
    expect(callback2).toHaveBeenCalledTimes(3);
  });
});
