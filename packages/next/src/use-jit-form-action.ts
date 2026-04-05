import { useCallback } from 'react';
import { useJitForm, type UseJitFormReturn } from '@jitforms/react';
import type { JitFormConfig, JitFormData, JitFormResult } from '@jitforms/js';

export interface UseJitFormActionOptions extends Omit<JitFormConfig, 'formHash'> {
  /** Called on successful submission */
  onSuccess?: (result: Extract<JitFormResult, { ok: true }>) => void;
  /** Called on failed submission */
  onError?: (result: Extract<JitFormResult, { ok: false }>) => void;
  /** Auto-redirect on success if redirect_url is present (default: true) */
  autoRedirect?: boolean;
}

export function useJitFormAction(
  formHash: string,
  options?: UseJitFormActionOptions,
): UseJitFormReturn & {
  /** Form action handler for <form action={formAction}> pattern */
  formAction: (formData: FormData) => Promise<void>;
} {
  const { onSuccess, onError, autoRedirect = true, ...config } = options ?? {};
  const form = useJitForm(formHash, config);

  const formAction = useCallback(
    async (formData: FormData) => {
      const data: JitFormData = {};

      formData.forEach((value, key) => {
        if (value instanceof File && value.size > 0) {
          data[key] = value;
        } else if (typeof value === 'string') {
          data[key] = value;
        }
      });

      const result = await form.submit(data);

      if (result.ok) {
        onSuccess?.(result);

        if (autoRedirect && result.redirectUrl && typeof window !== 'undefined') {
          window.location.href = result.redirectUrl;
        }
      } else {
        onError?.(result);
      }
    },
    [form, onSuccess, onError, autoRedirect],
  );

  return { ...form, formAction };
}
