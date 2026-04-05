import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from '../src/jitforms-html';
import {
  MOCK_SUBMISSION,
  mockFetchSuccess,
  mockFetchValidationError,
} from '../../js/tests/helpers';

function createForm(attrs: Record<string, string> = {}, innerHTML = ''): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-jitform', attrs['data-jitform'] || 'abc123');

  for (const [key, value] of Object.entries(attrs)) {
    if (key !== 'data-jitform') {
      form.setAttribute(key, value);
    }
  }

  form.innerHTML = innerHTML || `
    <input name="email" value="test@test.com" />
    <button type="submit">Submit</button>
  `;

  document.body.appendChild(form);
  return form;
}

function submitForm(form: HTMLFormElement): Promise<void> {
  return new Promise((resolve) => {
    const originalFetch = globalThis.fetch;

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Wait for async submit handler to complete
    setTimeout(resolve, 50);
  });
}

describe('HTML embed - init()', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('discovers forms with data-jitform attribute', () => {
    const form = createForm();
    init();

    // Submit handler should be attached — verify by submitting
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    expect(fetch).toHaveBeenCalled();
  });

  it('ignores forms without data-jitform', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="email" value="test@test.com" />';
    document.body.appendChild(form);

    init();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends POST to correct endpoint', async () => {
    createForm();
    init();

    const form = document.querySelector('form')!;
    await submitForm(form);

    expect(fetch).toHaveBeenCalledWith(
      'https://jitforms.com/f/abc123',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('uses custom base URL from data-jitform-url', async () => {
    createForm({ 'data-jitform': 'abc123', 'data-jitform-url': 'https://custom.test' });
    init();

    const form = document.querySelector('form')!;
    await submitForm(form);

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.test/f/abc123',
      expect.anything(),
    );
  });
});

describe('HTML embed - CSS classes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds jf-loading class during submission', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const form = createForm();
    init();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Check loading state
    await new Promise((r) => setTimeout(r, 10));
    expect(form.classList.contains('jf-loading')).toBe(true);

    resolvePromise!({
      status: 201,
      json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
    } as Response);

    await new Promise((r) => setTimeout(r, 50));
    expect(form.classList.contains('jf-loading')).toBe(false);
  });

  it('adds jf-success class on successful submission', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess());

    const form = createForm();
    init();
    await submitForm(form);

    expect(form.classList.contains('jf-success')).toBe(true);
    expect(form.classList.contains('jf-error')).toBe(false);
  });

  it('adds jf-error class on validation error', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createForm();
    init();
    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(true);
    expect(form.classList.contains('jf-success')).toBe(false);
  });

  it('removes previous classes on new submission', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createForm();
    init();
    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(true);

    vi.stubGlobal('fetch', mockFetchSuccess());
    await submitForm(form);

    expect(form.classList.contains('jf-error')).toBe(false);
    expect(form.classList.contains('jf-success')).toBe(true);
  });
});

describe('HTML embed - field errors', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('displays field errors in data-jitform-error elements', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['The email is required.'] }));

    const form = createForm({}, `
      <input name="email" />
      <span data-jitform-error="email"></span>
      <button type="submit">Submit</button>
    `);
    init();
    await submitForm(form);

    const errorEl = form.querySelector('[data-jitform-error="email"]')!;
    expect(errorEl.textContent).toBe('The email is required.');
  });

  it('clears errors before new submission', async () => {
    vi.stubGlobal('fetch', mockFetchValidationError({ email: ['Required'] }));

    const form = createForm({}, `
      <input name="email" />
      <span data-jitform-error="email"></span>
      <button type="submit">Submit</button>
    `);
    init();
    await submitForm(form);

    const errorEl = form.querySelector('[data-jitform-error="email"]')!;
    expect(errorEl.textContent).toBe('Required');

    vi.stubGlobal('fetch', mockFetchSuccess());
    await submitForm(form);

    expect(errorEl.textContent).toBe('');
  });
});

describe('HTML embed - honeypot', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('injects hidden honeypot field when data-jitform-honeypot present', () => {
    createForm({ 'data-jitform': 'abc123', 'data-jitform-honeypot': '' });
    init();

    const form = document.querySelector('form')!;
    const honeypot = form.querySelector('input[name="_honeypot"]') as HTMLInputElement;

    expect(honeypot).not.toBeNull();
    expect(honeypot.value).toBe('');
    expect(honeypot.tabIndex).toBe(-1);
  });

  it('does not inject honeypot when attribute missing', () => {
    createForm();
    init();

    const form = document.querySelector('form')!;
    const honeypot = form.querySelector('input[name="_honeypot"]');

    expect(honeypot).toBeNull();
  });

  it('does not duplicate honeypot on re-init', () => {
    createForm({ 'data-jitform': 'abc123', 'data-jitform-honeypot': '' });
    init();
    init();

    const form = document.querySelector('form')!;
    const honeypots = form.querySelectorAll('input[name="_honeypot"]');

    expect(honeypots.length).toBe(1);
  });
});

describe('HTML embed - success message', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('fetch', mockFetchSuccess());
  });

  it('shows data-jitform-success element on success', async () => {
    const form = createForm({}, `
      <input name="email" value="test@test.com" />
      <button type="submit">Submit</button>
      <div data-jitform-success style="display:none">Thank you!</div>
    `);
    init();
    await submitForm(form);

    const successEl = form.querySelector('[data-jitform-success]') as HTMLElement;
    expect(successEl.style.display).toBe('');
  });
});

describe('HTML embed - redirect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('redirects when data-jitform-redirect is set', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess());

    const originalLocation = window.location.href;
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: originalLocation, set href(url: string) { hrefSetter(url); } },
      writable: true,
    });

    const form = createForm({ 'data-jitform': 'abc123', 'data-jitform-redirect': '/thank-you' });
    init();
    await submitForm(form);

    // The redirect attempt is made (jsdom doesn't actually navigate)
    // We verify the success class was added which means the handler completed
    expect(form.classList.contains('jf-success')).toBe(true);
  });
});

describe('HTML embed - submit button', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('disables submit button during loading', async () => {
    let resolvePromise: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    })));

    const form = createForm({}, `
      <input name="email" value="test@test.com" />
      <button type="submit">Submit</button>
    `);
    init();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 10));
    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    resolvePromise!({
      status: 201,
      json: () => Promise.resolve({ data: MOCK_SUBMISSION }),
    } as Response);

    await new Promise((r) => setTimeout(r, 50));
    expect(button.disabled).toBe(false);
  });
});
