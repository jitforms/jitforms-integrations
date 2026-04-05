import { createJitForm, type JitFormConfig, type JitFormData } from '@jitforms/js';

/**
 * Initialize a JitForms form on the client side.
 * Used by the Astro component's client-side script.
 */
export function initForm(formElement: HTMLFormElement, formHash: string, options?: Omit<JitFormConfig, 'formHash'>) {
  const client = createJitForm({ formHash, ...options });

  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    formElement.classList.add('jf-loading');
    formElement.classList.remove('jf-success', 'jf-error');

    // Clear previous errors
    formElement.querySelectorAll('[data-jitform-error]').forEach(el => {
      el.textContent = '';
    });

    const formData = new FormData(formElement);
    const data: JitFormData = {};
    formData.forEach((value, key) => {
      if (value instanceof File && value.size > 0) {
        data[key] = value;
      } else if (typeof value === 'string') {
        data[key] = value;
      }
    });

    const result = await client.submit(data);
    formElement.classList.remove('jf-loading');

    if (result.ok) {
      formElement.classList.add('jf-success');

      // Show success message
      const successEl = formElement.querySelector('[data-jitform-success]');
      if (successEl instanceof HTMLElement) {
        successEl.style.display = '';
      }

      // Handle redirect
      const redirect = formElement.dataset.jitformRedirect || result.redirectUrl;
      if (redirect) {
        window.location.href = redirect;
      }
    } else {
      formElement.classList.add('jf-error');

      // Show field errors
      for (const [field, messages] of Object.entries(result.errors)) {
        const errorEl = formElement.querySelector(`[data-jitform-error="${field}"]`);
        if (errorEl) {
          errorEl.textContent = messages[0];
        }
      }
    }
  });
}

/**
 * Auto-initialize all forms with the data-jitform attribute.
 * Reads optional baseUrl from data-jitform-url.
 */
export function initAll() {
  document.querySelectorAll<HTMLFormElement>('form[data-jitform]').forEach(form => {
    const hash = form.dataset.jitform;
    if (!hash) {
      return;
    }

    const baseUrl = form.dataset.jitformUrl;
    initForm(form, hash, baseUrl ? { baseUrl } : undefined);
  });
}
