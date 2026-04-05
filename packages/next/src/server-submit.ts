import { submitForm, type JitFormConfig, type JitFormData, type JitFormResult } from '@jitforms/js';

export interface ServerSubmitOptions extends Omit<JitFormConfig, 'formHash'> {
  /** Override the base URL for server-side requests (useful for internal networking) */
  serverUrl?: string;
}

/**
 * Submit a form from the server side.
 * Use this in Next.js Server Actions or Route Handlers.
 * Bypasses CORS since the request comes from the server.
 */
export async function serverSubmitForm(
  formHash: string,
  data: JitFormData,
  options?: ServerSubmitOptions,
): Promise<JitFormResult> {
  const { serverUrl, ...config } = options ?? {};

  return submitForm(
    { ...config, formHash, baseUrl: serverUrl ?? config.baseUrl },
    data,
  );
}
