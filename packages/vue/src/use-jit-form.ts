import { ref, computed, type Ref, type ComputedRef } from 'vue';
import {
  createJitForm,
  type JitFormConfig,
  type JitFormData,
  type JitFormResult,
  type JitFormSubmission,
} from '@jitforms/js';

export interface UseJitFormOptions extends Omit<JitFormConfig, 'formHash'> {}

export interface UseJitFormReturn {
  submit: (data: JitFormData) => Promise<JitFormResult>;
  isLoading: Ref<boolean>;
  isSuccess: Ref<boolean>;
  isError: Ref<boolean>;
  error: Ref<{ message: string; errors: Record<string, string[]> } | null>;
  submission: Ref<JitFormSubmission | null>;
  redirectUrl: Ref<string | undefined>;
  reset: () => void;
  fieldErrors: ComputedRef<Record<string, string[]>>;
  fieldError: (field: string) => string | undefined;
}

export function useJitForm(
  formHash: string,
  options?: UseJitFormOptions,
): UseJitFormReturn {
  const client = createJitForm({ ...options, formHash });

  const isLoading = ref(false);
  const isSuccess = ref(false);
  const isError = ref(false);
  const error = ref<{ message: string; errors: Record<string, string[]> } | null>(null);
  const submission = ref<JitFormSubmission | null>(null);
  const redirectUrl = ref<string | undefined>(undefined);

  let submissionCounter = 0;

  const fieldErrors = computed<Record<string, string[]>>(() => {
    return error.value?.errors ?? {};
  });

  function fieldError(field: string): string | undefined {
    return error.value?.errors[field]?.[0];
  }

  async function submit(data: JitFormData): Promise<JitFormResult> {
    const currentSubmission = ++submissionCounter;

    isLoading.value = true;
    isSuccess.value = false;
    isError.value = false;
    error.value = null;

    const result = await client.submit(data);

    // Only update state if this is still the latest submission
    if (currentSubmission !== submissionCounter) {
      return result;
    }

    if (result.ok) {
      isLoading.value = false;
      isSuccess.value = true;
      isError.value = false;
      error.value = null;
      submission.value = result.submission;
      redirectUrl.value = result.redirectUrl;
    } else {
      isLoading.value = false;
      isSuccess.value = false;
      isError.value = true;
      error.value = { message: result.message, errors: result.errors };
      submission.value = null;
      redirectUrl.value = undefined;
    }

    return result;
  }

  function reset(): void {
    isLoading.value = false;
    isSuccess.value = false;
    isError.value = false;
    error.value = null;
    submission.value = null;
    redirectUrl.value = undefined;
  }

  return {
    submit,
    isLoading,
    isSuccess,
    isError,
    error,
    submission,
    redirectUrl,
    reset,
    fieldErrors,
    fieldError,
  };
}
