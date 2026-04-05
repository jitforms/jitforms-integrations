import {
  createJitForm,
  type JitFormConfig,
  type JitFormData,
  type JitFormResult,
  type JitFormSubmission,
} from '@jitforms/js';
import { BehaviorSubject, type Observable } from 'rxjs';

interface ZoneLike {
  run<T>(fn: () => T): T;
}
declare const Zone: { current: ZoneLike } | undefined;

export interface JitFormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: { message: string; errors: Record<string, string[]> } | null;
  submission: JitFormSubmission | null;
  redirectUrl: string | undefined;
}

const INITIAL_STATE: JitFormState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  submission: null,
  redirectUrl: undefined,
};

export class JitFormService {
  private state$ = new BehaviorSubject<JitFormState>(INITIAL_STATE);
  private client: ReturnType<typeof createJitForm>;
  /**
   * The zone active when the service was created. When constructed inside an
   * Angular component, this is NgZone, so emissions trigger change detection
   * without any manual intervention from callers.
   */
  private zone: ZoneLike | null = typeof Zone !== 'undefined' ? Zone.current : null;

  constructor(formHash: string, options?: Omit<JitFormConfig, 'formHash'>) {
    this.client = createJitForm({ formHash, ...options });
  }

  private emit(state: JitFormState): void {
    if (this.zone) {
      this.zone.run(() => this.state$.next(state));
    } else {
      this.state$.next(state);
    }
  }

  get state(): Observable<JitFormState> {
    return this.state$.asObservable();
  }

  get snapshot(): JitFormState {
    return this.state$.getValue();
  }

  async submit(data: JitFormData): Promise<JitFormResult> {
    this.emit({ ...INITIAL_STATE, isLoading: true });

    const result = await this.client.submit(data);

    if (result.ok) {
      this.emit({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        submission: result.submission,
        redirectUrl: result.redirectUrl,
      });
    } else {
      this.emit({
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

  fieldErrors(): Record<string, string[]> {
    return this.snapshot.error?.errors ?? {};
  }

  fieldError(field: string): string | undefined {
    return this.snapshot.error?.errors[field]?.[0];
  }

  reset(): void {
    this.emit(INITIAL_STATE);
  }

  destroy(): void {
    this.state$.complete();
  }
}

export function createJitFormService(
  formHash: string,
  options?: Omit<JitFormConfig, 'formHash'>,
): JitFormService {
  return new JitFormService(formHash, options);
}
