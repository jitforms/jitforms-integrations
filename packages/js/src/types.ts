export interface JitFormConfig {
  /** Base URL of JitForms instance (default: 'https://jitforms.com') */
  baseUrl?: string;
  /** Form hash identifier */
  formHash: string;
  /** Include honeypot field for spam protection */
  honeypot?: boolean | string;
  /** Captcha token to include with submission */
  captchaToken?: string;
  /** Custom headers to include */
  headers?: Record<string, string>;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
}

export interface JitFormData {
  [key: string]: string | number | boolean | File | FileList | null | undefined;
}

export interface JitFormSubmission {
  id: string;
  data: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  referrer: string | null;
  is_spam: boolean;
  spam_score: number;
  is_read: boolean;
  created_at: string;
}

export interface JitFormSuccessResponse {
  data: JitFormSubmission;
  redirect_url?: string;
}

export interface JitFormErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export type JitFormResult =
  | { ok: true; submission: JitFormSubmission; redirectUrl?: string }
  | { ok: false; status: number; message: string; errors: Record<string, string[]> };
