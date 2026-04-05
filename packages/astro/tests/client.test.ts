import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initForm, initAll } from '../src/client';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
} from '../../js/tests/helpers';

function createFormElement(hash = 'abc123', attrs: Record<string, string> = {}): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-jitform', hash);

  for (const [key, value] of Object.entries(attrs)) {
    form.setAttribute(key, value);
  }

  form.innerHTML = `
    <input name="email" value="test@test.com" />
    <span data-jitform-error="email"></span>
    <button type="submit">Submit</button>
    <div data-jitform-success style="display:none">Thank you!</div>
  `;

  document.body.appendChild(form);
  return form;
}

function submitForm(form: HTMLFormElement): Promise<void> {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return new Promise((r) => setTimeout(r, 50));
}

describe('initForm', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('attaches submit handler to form', async () => {
    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);

    expect(fetch).toHaveBeenCalledWith(
      'https://jitforms.com/f/abc123',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('passes options to client', async () => {
    const form = createFormElement();
    initForm(form, 'abc123', { baseUrl: 'https://custom.test' });

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
    initForm(form, 'abc123');

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
    initForm(form, 'abc123');

    await submitForm(form);

    expect(form.classList.contains('jf-success')).toBe(true);
  });

  it('shows success element on success', async () => {
    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);

    const successEl = form.querySelector('[data-jitform-success]') as HTMLElement;
    expect(successEl.style.display).toBe('');
  });

  it('adds jf-error class on validation error', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(true);
  });

  it('shows field errors', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['The email is required.'] }));

    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);

    const errorEl = form.querySelector('[data-jitform-error="email"]')!;
    expect(errorEl.textContent).toBe('The email is required.');
  });

  it('clears previous errors on new submission', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);

    const errorEl = form.querySelector('[data-jitform-error="email"]')!;
    expect(errorEl.textContent).toBe('Required');

    vi.stubGlobal('fetch', mockFetchSuccess());
    await submitForm(form);

    expect(errorEl.textContent).toBe('');
  });

  it('collects form data as string values', async () => {
    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]!.body as string);

    expect(body.email).toBe('test@test.com');
  });

  it('clears previous classes on new submit', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createFormElement();
    initForm(form, 'abc123');

    await submitForm(form);
    expect(form.classList.contains('jf-error')).toBe(true);

    vi.stubGlobal('fetch', mockFetchSuccess());
    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(false);
    expect(form.classList.contains('jf-success')).toBe(true);
  });
});

describe('initAll', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('initializes all forms with data-jitform attribute', async () => {
    createFormElement('form1');
    createFormElement('form2');

    initAll();

    const forms = document.querySelectorAll('form');
    await submitForm(forms[0] as HTMLFormElement);
    await submitForm(forms[1] as HTMLFormElement);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('https://jitforms.com/f/form1', expect.anything());
    expect(fetch).toHaveBeenCalledWith('https://jitforms.com/f/form2', expect.anything());
  });

  it('reads base URL from data-jitform-url', async () => {
    createFormElement('abc123', { 'data-jitform-url': 'https://custom.test' });

    initAll();

    const form = document.querySelector('form')!;
    await submitForm(form as HTMLFormElement);

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });

  it('skips forms without data-jitform attribute', () => {
    const form = document.createElement('form');
    document.body.appendChild(form);

    initAll();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips forms with empty data-jitform', () => {
    const form = document.createElement('form');
    form.setAttribute('data-jitform', '');
    document.body.appendChild(form);

    initAll();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(fetch).not.toHaveBeenCalled();
  });
});
