import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jitform } from '../src/action';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
} from '../../js/tests/helpers';

function createFormElement(): HTMLFormElement {
  const form = document.createElement('form');
  form.innerHTML = `
    <input name="email" value="test@test.com" />
    <button type="submit">Submit</button>
  `;
  document.body.appendChild(form);
  return form;
}

function submitForm(form: HTMLFormElement): Promise<void> {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return new Promise((r) => setTimeout(r, 50));
}

describe('jitform action', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('returns destroy and update methods', () => {
    const form = createFormElement();
    const result = jitform(form, 'abc123');

    expect(typeof result.destroy).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  it('intercepts form submit and sends POST', async () => {
    const form = createFormElement();
    jitform(form, 'abc123');

    await submitForm(form);

    expect(fetch).toHaveBeenCalledWith(
      'https://jitforms.com/f/abc123',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('accepts config object', async () => {
    const form = createFormElement();
    jitform(form, { formHash: 'abc123', baseUrl: 'https://custom.test' });

    await submitForm(form);

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('adds jf-loading class during submission', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const form = createFormElement();
    jitform(form, 'abc123');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 10));
    expect(form.classList.contains('jf-loading')).toBe(true);

    resolvePromise!({
      status: 201,
      json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
    } as Response);

    await new Promise((r) => setTimeout(r, 50));
    expect(form.classList.contains('jf-loading')).toBe(false);
  });

  it('adds jf-success class on success', async () => {
    const form = createFormElement();
    jitform(form, 'abc123');

    await submitForm(form);

    expect(form.classList.contains('jf-success')).toBe(true);
    expect(form.classList.contains('jf-error')).toBe(false);
  });

  it('adds jf-error class on validation error', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createFormElement();
    jitform(form, 'abc123');

    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(true);
    expect(form.classList.contains('jf-success')).toBe(false);
  });

  it('dispatches jitform:success event', async () => {
    const form = createFormElement();
    jitform(form, 'abc123');

    const handler = vi.fn();
    form.addEventListener('jitform:success', handler);

    await submitForm(form);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.submission).toEqual(MOCK_SUBMISSION);
  });

  it('dispatches jitform:error event', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createFormElement();
    jitform(form, 'abc123');

    const handler = vi.fn();
    form.addEventListener('jitform:error', handler);

    await submitForm(form);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.errors).toEqual({ email: ['Required'] });
    expect(event.detail.status).toBe(422);
  });

  it('dispatches jitform:loading event', async () => {
    const form = createFormElement();
    jitform(form, 'abc123');

    const handler = vi.fn();
    form.addEventListener('jitform:loading', handler);

    await submitForm(form);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('destroy removes submit listener', async () => {
    const form = createFormElement();
    const action = jitform(form, 'abc123');

    action.destroy();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('destroy clears CSS classes', () => {
    const form = createFormElement();
    form.classList.add('jf-loading', 'jf-success', 'jf-error');

    const action = jitform(form, 'abc123');
    action.destroy();

    expect(form.classList.contains('jf-loading')).toBe(false);
    expect(form.classList.contains('jf-success')).toBe(false);
    expect(form.classList.contains('jf-error')).toBe(false);
  });

  it('update changes the client config', async () => {
    const form = createFormElement();
    const action = jitform(form, 'abc123');

    action.update({ formHash: 'xyz789', baseUrl: 'https://new.test' });

    await submitForm(form);

    expect(fetch).toHaveBeenCalledWith(
      'https://new.test/f/xyz789',
      expect.anything(),
    );
  });

  it('clears previous classes on new submit', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createFormElement();
    jitform(form, 'abc123');

    await submitForm(form);
    expect(form.classList.contains('jf-error')).toBe(true);

    vi.stubGlobal('fetch', mockFetchSuccess());
    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(false);
    expect(form.classList.contains('jf-success')).toBe(true);
  });
});
