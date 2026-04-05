import {
  createJitForm,
  type JitFormConfig,
  type JitFormData,
  type JitFormResult,
} from '@jitforms/js';

interface JitFormActionReturn {
  destroy: () => void;
  update: (config: string | JitFormConfig) => void;
}

function resolveConfig(config: string | JitFormConfig): JitFormConfig {
  return typeof config === 'string' ? { formHash: config } : config;
}

/**
 * Svelte action for progressive form enhancement with JitForms.
 *
 * Intercepts the native form submit, collects FormData, submits to JitForms,
 * and dispatches custom events on the form element.
 *
 * Events dispatched:
 * - `jitform:loading` - When submission starts
 * - `jitform:success` - On successful submission (detail: { submission, redirectUrl })
 * - `jitform:error` - On validation/submission error (detail: { message, errors, status })
 *
 * CSS classes toggled:
 * - `jf-loading` - While submission is in progress
 * - `jf-success` - After successful submission
 * - `jf-error` - After failed submission
 *
 * @param node - The form element
 * @param config - Form hash string or full JitFormConfig object
 */
export function jitform(
  node: HTMLFormElement,
  config: string | JitFormConfig,
): JitFormActionReturn {
  let client = createJitForm(resolveConfig(config));

  function clearClasses(): void {
    node.classList.remove('jf-loading', 'jf-success', 'jf-error');
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    clearClasses();
    node.classList.add('jf-loading');
    node.dispatchEvent(new CustomEvent('jitform:loading', { bubbles: true }));

    const formData = new FormData(node);
    const data: JitFormData = Object.fromEntries(formData.entries());

    let result: JitFormResult;

    try {
      result = await client.submit(data);
    } catch (error) {
      node.classList.remove('jf-loading');
      node.classList.add('jf-error');
      node.dispatchEvent(
        new CustomEvent('jitform:error', {
          bubbles: true,
          detail: {
            message: error instanceof Error ? error.message : 'Unknown error',
            errors: {},
            status: 0,
          },
        }),
      );
      return;
    }

    node.classList.remove('jf-loading');

    if (result.ok) {
      node.classList.add('jf-success');
      node.dispatchEvent(
        new CustomEvent('jitform:success', {
          bubbles: true,
          detail: {
            submission: result.submission,
            redirectUrl: result.redirectUrl,
          },
        }),
      );
    } else {
      node.classList.add('jf-error');
      node.dispatchEvent(
        new CustomEvent('jitform:error', {
          bubbles: true,
          detail: {
            message: result.message,
            errors: result.errors,
            status: result.status,
          },
        }),
      );
    }
  }

  node.addEventListener('submit', handleSubmit);

  return {
    update(newConfig: string | JitFormConfig): void {
      client = createJitForm(resolveConfig(newConfig));
    },
    destroy(): void {
      node.removeEventListener('submit', handleSubmit);
      clearClasses();
    },
  };
}
