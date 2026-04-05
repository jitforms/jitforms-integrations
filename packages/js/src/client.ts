import { JitFormError } from './errors';
import type {
  JitFormConfig,
  JitFormData,
  JitFormErrorResponse,
  JitFormResult,
  JitFormSuccessResponse,
} from './types';

const DEFAULT_BASE_URL = 'https://jitforms.com';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_HONEYPOT_FIELD = '_honeypot';

function hasFiles(data: JitFormData): boolean {
  return Object.values(data).some(
    (value) =>
      value instanceof File ||
      (typeof FileList !== 'undefined' && value instanceof FileList),
  );
}

function buildFormData(data: JitFormData): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof FileList !== 'undefined' && value instanceof FileList) {
      for (let i = 0; i < value.length; i++) {
        formData.append(`${key}[]`, value[i]);
      }
    } else if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }

  return formData;
}

function buildJsonBody(data: JitFormData): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      body[key] = value;
    }
  }

  return body;
}

function addHoneypot(data: JitFormData, honeypot: boolean | string | undefined): void {
  if (!honeypot) {
    return;
  }

  const field = typeof honeypot === 'string' ? honeypot : DEFAULT_HONEYPOT_FIELD;
  data[field] = '';
}

function addCaptchaToken(data: JitFormData, token: string | undefined): void {
  if (token) {
    data['captcha_token'] = token;
  }
}

export async function submitForm(
  config: JitFormConfig,
  data: JitFormData,
): Promise<JitFormResult> {
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  const url = `${baseUrl}/f/${config.formHash}`;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const payload = { ...data };
  addHoneypot(payload, config.honeypot);
  addCaptchaToken(payload, config.captchaToken);

  const useFormData = hasFiles(payload);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...config.headers,
    };

    let body: FormData | string;

    if (useFormData) {
      body = buildFormData(payload);
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(buildJsonBody(payload));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    if (response.status === 201) {
      const json = (await response.json()) as JitFormSuccessResponse;
      return {
        ok: true,
        submission: json.data,
        redirectUrl: json.redirect_url,
      };
    }

    if (response.status === 422) {
      const json = (await response.json()) as JitFormErrorResponse;
      return {
        ok: false,
        status: 422,
        message: json.message || 'Validation failed',
        errors: json.errors || {},
      };
    }

    return {
      ok: false,
      status: response.status,
      message: `Request failed with status ${response.status}`,
      errors: {},
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new JitFormError('Request timed out', 0);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createJitForm(config: JitFormConfig) {
  return {
    submit(data: JitFormData = {}): Promise<JitFormResult> {
      return submitForm(config, data);
    },
  };
}
