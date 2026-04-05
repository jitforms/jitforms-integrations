import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JitFormService, createJitFormService } from '../src/jit-form.service';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
  mockFetchServerError,
} from '../../js/tests/helpers';

describe('JitFormService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('creates service with formHash', () => {
    const service = new JitFormService('abc123');
    expect(service).toBeInstanceOf(JitFormService);
  });

  it('has correct initial snapshot', () => {
    const service = new JitFormService('abc123');

    expect(service.snapshot).toEqual({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      submission: null,
      redirectUrl: undefined,
    });
  });

  it('state observable emits initial state', () => {
    const service = new JitFormService('abc123');
    const callback = vi.fn();

    service.state.subscribe(callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: false,
        isSuccess: false,
      }),
    );
  });

  it('emits loading state during submission', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const service = new JitFormService('abc123');
    const states: boolean[] = [];

    service.state.subscribe((state) => {
      states.push(state.isLoading);
    });

    const submitPromise = service.submit({ name: 'John' });

    expect(states).toEqual([false, true]);

    resolvePromise!({
      status: 201,
      json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
    } as Response);

    await submitPromise;

    expect(states).toEqual([false, true, false]);
  });

  it('sets success state on 201', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const service = new JitFormService('abc123');

    await service.submit({ name: 'John' });

    expect(service.snapshot.isSuccess).toBe(true);
    expect(service.snapshot.isError).toBe(false);
    expect(service.snapshot.submission).toEqual(MOCK_SUBMISSION);
    expect(service.snapshot.redirectUrl).toBe('https://example.com/thanks');
  });

  it('sets error state on 422', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const service = new JitFormService('abc123');

    await service.submit({});

    expect(service.snapshot.isSuccess).toBe(false);
    expect(service.snapshot.isError).toBe(true);
    expect(service.snapshot.error).toEqual({
      message: 'Validation failed',
      errors: { email: ['Required'] },
    });
  });

  it('fieldErrors returns error map', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({
      email: ['Required'],
      name: ['Too short'],
    }));

    const service = new JitFormService('abc123');

    await service.submit({});

    expect(service.fieldErrors()).toEqual({
      email: ['Required'],
      name: ['Too short'],
    });
  });

  it('fieldErrors returns empty object when no error', () => {
    const service = new JitFormService('abc123');

    expect(service.fieldErrors()).toEqual({});
  });

  it('fieldError returns first error for a field', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({
      email: ['Required', 'Must be valid'],
    }));

    const service = new JitFormService('abc123');

    await service.submit({});

    expect(service.fieldError('email')).toBe('Required');
    expect(service.fieldError('name')).toBeUndefined();
  });

  it('reset clears state', async () => {
    const service = new JitFormService('abc123');

    await service.submit({ name: 'John' });

    expect(service.snapshot.isSuccess).toBe(true);

    service.reset();

    expect(service.snapshot).toEqual({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      submission: null,
      redirectUrl: undefined,
    });
  });

  it('reset notifies subscribers', async () => {
    const service = new JitFormService('abc123');
    const callback = vi.fn();

    service.state.subscribe(callback);
    callback.mockClear();

    service.reset();

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ isSuccess: false, isLoading: false }),
    );
  });

  it('destroy completes the observable', () => {
    const service = new JitFormService('abc123');
    const completeFn = vi.fn();

    service.state.subscribe({
      complete: completeFn,
    });

    service.destroy();

    expect(completeFn).toHaveBeenCalled();
  });

  it('passes options to client', async () => {
    const service = new JitFormService('abc123', { baseUrl: 'https://custom.test' });

    await service.submit({ name: 'John' });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('handles server error', async () => {
    vi.stubGlobal('fetch', mockFetchServerError());

    const service = new JitFormService('abc123');

    await service.submit({});

    expect(service.snapshot.isError).toBe(true);
    expect(service.snapshot.error?.message).toBe('Request failed with status 500');
  });

  it('returns result from submit', async () => {
    const service = new JitFormService('abc123');

    const result = await service.submit({ name: 'John' });

    expect(result).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: undefined,
    });
  });

  it('multiple subscribers receive updates', async () => {
    const service = new JitFormService('abc123');
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    service.state.subscribe(callback1);
    service.state.subscribe(callback2);

    await service.submit({ name: 'John' });

    // initial + loading + success = 3
    expect(callback1).toHaveBeenCalledTimes(3);
    expect(callback2).toHaveBeenCalledTimes(3);
  });
});

describe('zone awareness', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('runs emissions inside the zone active at construction time', async () => {
    const runs: string[] = [];
    const fakeZone = {
      run<T>(fn: () => T): T {
        runs.push('zone.run');
        return fn();
      },
    };
    vi.stubGlobal('Zone', { current: fakeZone });

    const service = new JitFormService('abc123');
    await service.submit({ name: 'Jane' });

    // One run() per emit: loading + success = 2 (snapshot initialization doesn't emit).
    expect(runs.length).toBeGreaterThanOrEqual(2);
    vi.unstubAllGlobals();
  });

  it('still emits when no Zone global is present', async () => {
    const service = new JitFormService('abc123');
    const states: boolean[] = [];
    service.state.subscribe((s) => states.push(s.isSuccess));
    await service.submit({ name: 'Jane' });
    expect(states).toContain(true);
  });
});

describe('createJitFormService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('creates a JitFormService instance', () => {
    const service = createJitFormService('abc123');

    expect(service).toBeInstanceOf(JitFormService);
  });

  it('passes options through', async () => {
    const service = createJitFormService('abc123', { baseUrl: 'https://custom.test' });

    await service.submit({});

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });
});
