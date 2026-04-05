const DEFAULT_BASE_URL = 'https://jitforms.com';
const DEFAULT_HONEYPOT_FIELD = '_honeypot';

interface SubmitSuccessResponse {
  data: Record<string, unknown>;
  redirect_url?: string;
}

interface SubmitErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

function getBaseUrl(form: HTMLFormElement): string {
  const customUrl = form.getAttribute('data-jitform-url');

  return (customUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function getFormHash(form: HTMLFormElement): string {
  return form.getAttribute('data-jitform') || '';
}

function hasHoneypot(form: HTMLFormElement): boolean {
  return form.hasAttribute('data-jitform-honeypot');
}

function getRedirectUrl(form: HTMLFormElement): string | null {
  return form.getAttribute('data-jitform-redirect');
}

function injectHoneypot(form: HTMLFormElement): void {
  if (!hasHoneypot(form)) {
    return;
  }

  if (form.querySelector(`input[name="${DEFAULT_HONEYPOT_FIELD}"]`)) {
    return;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.name = DEFAULT_HONEYPOT_FIELD;
  input.value = '';
  input.tabIndex = -1;
  input.autocomplete = 'off';
  input.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';

  form.appendChild(input);
}

function setLoadingState(form: HTMLFormElement, loading: boolean): void {
  const submitButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"], input[type="submit"]',
  );

  if (loading) {
    form.classList.add('jf-loading');
    form.classList.remove('jf-success', 'jf-error');

    if (submitButton) {
      submitButton.disabled = true;
    }
  } else {
    form.classList.remove('jf-loading');

    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function clearErrors(form: HTMLFormElement): void {
  const errorElements = form.querySelectorAll<HTMLElement>('[data-jitform-error]');

  for (const element of errorElements) {
    element.textContent = '';
    element.classList.remove('jf-field-error');
    element.style.display = 'none';
  }
}

function showFieldErrors(form: HTMLFormElement, errors: Record<string, string[]>): void {
  for (const [field, messages] of Object.entries(errors)) {
    const errorElement = form.querySelector<HTMLElement>(
      `[data-jitform-error="${field}"]`,
    );

    if (errorElement) {
      errorElement.textContent = messages[0] || '';
      errorElement.classList.add('jf-field-error');
      errorElement.style.display = '';
    }
  }
}

function showSuccess(form: HTMLFormElement): void {
  form.classList.add('jf-success');

  const successElement = form.querySelector<HTMLElement>('[data-jitform-success]');

  if (successElement) {
    successElement.style.display = '';
  }
}

function showError(form: HTMLFormElement): void {
  form.classList.add('jf-error');
}

function collectFormData(form: HTMLFormElement): FormData {
  return new FormData(form);
}

function hasFiles(formData: FormData): boolean {
  for (const value of formData.values()) {
    if (value instanceof File && value.size > 0) {
      return true;
    }
  }

  return false;
}

function formDataToJson(formData: FormData): Record<string, unknown> {
  const json: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      continue;
    }

    json[key] = value;
  }

  return json;
}

async function handleSubmit(form: HTMLFormElement, event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const hash = getFormHash(form);

  if (!hash) {
    console.error('[JitForms] Missing data-jitform hash on form.');
    return;
  }

  const baseUrl = getBaseUrl(form);
  const url = `${baseUrl}/f/${hash}`;

  clearErrors(form);
  setLoadingState(form, true);

  const formData = collectFormData(form);
  const useFormData = hasFiles(formData);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  let body: FormData | string;

  if (useFormData) {
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(formDataToJson(formData));
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (response.status === 201) {
      const json = (await response.json()) as SubmitSuccessResponse;

      setLoadingState(form, false);
      showSuccess(form);

      const redirectUrl = json.redirect_url || getRedirectUrl(form);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

      return;
    }

    if (response.status === 422) {
      const json = (await response.json()) as SubmitErrorResponse;

      setLoadingState(form, false);
      showError(form);
      showFieldErrors(form, json.errors || {});

      return;
    }

    setLoadingState(form, false);
    showError(form);
    console.error(`[JitForms] Request failed with status ${response.status}.`);
  } catch (error) {
    setLoadingState(form, false);
    showError(form);
    console.error('[JitForms] Network error:', error);
  }
}

function bindForm(form: HTMLFormElement): void {
  injectHoneypot(form);

  form.addEventListener('submit', (event: SubmitEvent) => {
    handleSubmit(form, event);
  });
}

/**
 * Discover and enhance all forms with `data-jitform` attribute.
 */
export function init(): void {
  const forms = document.querySelectorAll<HTMLFormElement>('form[data-jitform]');

  for (const form of forms) {
    bindForm(form);
  }
}
