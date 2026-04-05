import {
  createJitForm as createClient,
  type JitFormConfig,
  type JitFormData,
  type JitFormResult,
  type JitFormSubmission,
} from '@jitforms/js';

export interface JitFormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: { message: string; errors: Record<string, string[]> } | null;
  submission: JitFormSubmission | null;
  redirectUrl: string | undefined;
}

export interface JitFormStore extends JitFormState {
  submit: (data: JitFormData) => Promise<JitFormResult>;
  reset: () => void;
  fieldErrors: Record<string, string[]>;
  fieldError: (field: string) => string | undefined;
  subscribe: (fn: (state: JitFormStore) => void) => () => void;
}

const initialState: JitFormState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  submission: null,
  redirectUrl: undefined,
};

/**
 * Creates a Svelte-compatible store for managing JitForms submissions.
 *
 * Works with Svelte's `$store` auto-subscription syntax in both Svelte 4 and 5.
 *
 * @param formHashOrConfig - Form hash string or full JitFormConfig object
 * @returns A store with `subscribe`, `submit`, `reset`, `fieldErrors`, and `fieldError`
 */
export function createJitForm(
  formHashOrConfig: string | JitFormConfig,
): JitFormStore {
  const config: JitFormConfig =
    typeof formHashOrConfig === 'string'
      ? { formHash: formHashOrConfig }
      : formHashOrConfig;

  const client = createClient(config);

  let state: JitFormState = { ...initialState };
  const subscribers = new Set<(state: JitFormStore) => void>();

  function notify(): void {
    const storeValue = buildStoreValue();
    for (const fn of subscribers) {
      fn(storeValue);
    }
  }

  function setState(partial: Partial<JitFormState>): void {
    state = { ...state, ...partial };
    notify();
  }

  async function submit(data: JitFormData): Promise<JitFormResult> {
    setState({
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
    });

    const result = await client.submit(data);

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
  }

  function reset(): void {
    state = { ...initialState };
    notify();
  }

  function getFieldErrors(): Record<string, string[]> {
    return state.error?.errors ?? {};
  }

  function fieldError(field: string): string | undefined {
    return state.error?.errors[field]?.[0];
  }

  function subscribe(fn: (state: JitFormStore) => void): () => void {
    subscribers.add(fn);
    fn(buildStoreValue());

    return () => {
      subscribers.delete(fn);
    };
  }

  function buildStoreValue(): JitFormStore {
    return {
      ...state,
      submit,
      reset,
      fieldErrors: getFieldErrors(),
      fieldError,
      subscribe,
    };
  }

  return buildStoreValue();
}
