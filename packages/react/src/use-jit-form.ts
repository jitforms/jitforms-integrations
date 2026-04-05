import { useState, useCallback, useRef } from 'react';
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
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: { message: string; errors: Record<string, string[]> } | null;
  submission: JitFormSubmission | null;
  redirectUrl: string | undefined;
  reset: () => void;
  fieldErrors: Record<string, string[]>;
  fieldError: (field: string) => string | undefined;
}

interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: { message: string; errors: Record<string, string[]> } | null;
  submission: JitFormSubmission | null;
  redirectUrl: string | undefined;
}

const initialState: FormState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  submission: null,
  redirectUrl: undefined,
};

export function useJitForm(
  formHash: string,
  options?: UseJitFormOptions,
): UseJitFormReturn {
  const [state, setState] = useState<FormState>(initialState);

  const clientRef = useRef(
    createJitForm({ ...options, formHash }),
  );

  const submissionCounter = useRef(0);

  const submit = useCallback(
    async (data: JitFormData): Promise<JitFormResult> => {
      const currentSubmission = ++submissionCounter.current;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null,
      }));

      const result = await clientRef.current.submit(data);

      // Only update state if this is still the latest submission
      if (currentSubmission !== submissionCounter.current) {
        return result;
      }

      if (result.ok) {
        setState({
          isLoading: false,
          isSuccess: true,
          isError: false,
          error: null,
          submission: result.submission,
          redirectUrl: result.redirectUrl,
        });
      } else {
        setState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          error: { message: result.message, errors: result.errors },
          submission: null,
          redirectUrl: undefined,
        });
      }

      return result;
    },
    [],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const fieldErrors = state.error?.errors ?? {};

  const fieldError = useCallback(
    (field: string): string | undefined => {
      return state.error?.errors[field]?.[0];
    },
    [state.error],
  );

  return {
    submit,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
    submission: state.submission,
    redirectUrl: state.redirectUrl,
    reset,
    fieldErrors,
    fieldError,
  };
}
