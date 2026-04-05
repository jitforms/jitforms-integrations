import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { useJitForm } from '../src/use-jit-form';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
  mockFetchServerError,
} from '../../js/tests/helpers';

describe('useJitForm (Vue)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('returns initial state', () => {
    const form = useJitForm('abc123');

    expect(form.isLoading.value).toBe(false);
    expect(form.isSuccess.value).toBe(false);
    expect(form.isError.value).toBe(false);
    expect(form.error.value).toBeNull();
    expect(form.submission.value).toBeNull();
    expect(form.redirectUrl.value).toBeUndefined();
    expect(form.fieldErrors.value).toEqual({});
  });

  it('sets isLoading during submission', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const form = useJitForm('abc123');

    const submitPromise = form.submit({ name: 'John' });

    await nextTick();
    expect(form.isLoading.value).toBe(true);

    resolvePromise!({
      status: 201,
      json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
    } as Response);

    await submitPromise;
    expect(form.isLoading.value).toBe(false);
  });

  it('sets success state on 201', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SUBMISSION, 'https://example.com/thanks'));

    const form = useJitForm('abc123');

    await form.submit({ name: 'John' });

    expect(form.isSuccess.value).toBe(true);
    expect(form.isError.value).toBe(false);
    expect(form.submission.value).toEqual(MOCK_SUBMISSION);
    expect(form.redirectUrl.value).toBe('https://example.com/thanks');
    expect(form.error.value).toBeNull();
  });

  it('sets error state on 422', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = useJitForm('abc123');

    await form.submit({});

    expect(form.isSuccess.value).toBe(false);
    expect(form.isError.value).toBe(true);
    expect(form.error.value).toEqual({
      message: 'Validation failed',
      errors: { email: ['Required'] },
    });
    expect(form.submission.value).toBeNull();
  });

  it('fieldErrors computed returns errors', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'], name: ['Too short'] }));

    const form = useJitForm('abc123');

    await form.submit({});

    expect(form.fieldErrors.value).toEqual({
      email: ['Required'],
      name: ['Too short'],
    });
  });

  it('fieldError returns first error for a field', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({
      email: ['Required', 'Must be valid'],
    }));

    const form = useJitForm('abc123');

    await form.submit({});

    expect(form.fieldError('email')).toBe('Required');
    expect(form.fieldError('name')).toBeUndefined();
  });

  it('reset clears all state', async () => {
    const form = useJitForm('abc123');

    await form.submit({ name: 'John' });

    expect(form.isSuccess.value).toBe(true);

    form.reset();

    expect(form.isLoading.value).toBe(false);
    expect(form.isSuccess.value).toBe(false);
    expect(form.isError.value).toBe(false);
    expect(form.error.value).toBeNull();
    expect(form.submission.value).toBeNull();
    expect(form.redirectUrl.value).toBeUndefined();
  });

  it('handles server error', async () => {
    vi.stubGlobal('fetch', mockFetchServerError());

    const form = useJitForm('abc123');

    await form.submit({});

    expect(form.isError.value).toBe(true);
    expect(form.error.value?.message).toBe('Request failed with status 500');
  });

  it('passes options to client', async () => {
    const form = useJitForm('abc123', { baseUrl: 'https://custom.test' });

    await form.submit({ name: 'John' });

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('returns result from submit', async () => {
    const form = useJitForm('abc123');

    const result = await form.submit({ name: 'John' });

    expect(result).toEqual({
      ok: true,
      submission: MOCK_SUBMISSION,
      redirectUrl: undefined,
    });
  });

  it('clears previous error on new submission', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = useJitForm('abc123');

    await form.submit({});

    expect(form.isError.value).toBe(true);

    vi.stubGlobal('fetch', mockFetchSuccess());

    await form.submit({ email: 'test@test.com' });

    expect(form.isError.value).toBe(false);
    expect(form.isSuccess.value).toBe(true);
    expect(form.error.value).toBeNull();
  });
});
