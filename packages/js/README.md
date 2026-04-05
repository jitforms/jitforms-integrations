# @jitforms/js

Lightweight JavaScript/TypeScript SDK for [JitForms](https://jitforms.com). ~2KB gzipped, zero dependencies.

## Installation

```bash
npm install @jitforms/js
```

## Quick Start

```ts
import { createJitForm } from '@jitforms/js';

const form = createJitForm({ formHash: 'abc123' });

const result = await form.submit({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!',
});

if (result.ok) {
  console.log('Submitted!', result.submission);
  if (result.redirectUrl) {
    window.location.href = result.redirectUrl;
  }
} else {
  console.error(result.errors);
}
```

## API

### `createJitForm(config)`

Creates a form instance with the given configuration. Returns an object with a `submit(data)` method.

### `submitForm(config, data)`

Standalone function for one-off submissions.

### Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `formHash` | `string` | *required* | Form hash identifier |
| `baseUrl` | `string` | `'https://jitforms.com'` | Base URL of JitForms instance |
| `honeypot` | `boolean \| string` | `false` | Enable honeypot spam protection. Pass `true` for default field name (`_honeypot`) or a custom field name. |
| `captchaToken` | `string` | - | Captcha token to include with submission |
| `headers` | `Record<string, string>` | - | Custom headers to include |
| `timeout` | `number` | `10000` | Request timeout in milliseconds |

### Result Type

The `submit` method returns a `Promise<JitFormResult>` which is a discriminated union:

```ts
// Success (HTTP 201)
{ ok: true; submission: JitFormSubmission; redirectUrl?: string }

// Error (HTTP 422 or other)
{ ok: false; status: number; message: string; errors: Record<string, string[]> }
```

## Examples

### With Honeypot Protection

```ts
const form = createJitForm({
  formHash: 'abc123',
  honeypot: true, // adds hidden '_honeypot' field
});
```

### With Custom Honeypot Field

```ts
const form = createJitForm({
  formHash: 'abc123',
  honeypot: 'website_url', // custom field name
});
```

### With Captcha

```ts
const token = await getCaptchaToken(); // from your captcha provider

const form = createJitForm({
  formHash: 'abc123',
  captchaToken: token,
});
```

### File Uploads

When any value is a `File` or `FileList`, the SDK automatically switches from JSON to `multipart/form-data`.

```ts
const fileInput = document.querySelector<HTMLInputElement>('#file');

const result = await form.submit({
  name: 'Jane',
  attachment: fileInput.files[0],
});
```

### Self-Hosted Instance

```ts
const form = createJitForm({
  formHash: 'abc123',
  baseUrl: 'https://forms.yoursite.com',
});
```

### Error Handling

```ts
const result = await form.submit({ email: 'invalid' });

if (!result.ok) {
  // result.errors is Record<string, string[]>
  // e.g. { email: ['The email field must be a valid email address.'] }
  for (const [field, messages] of Object.entries(result.errors)) {
    console.log(`${field}: ${messages.join(', ')}`);
  }
}
```

### Timeout Handling

```ts
import { createJitForm, JitFormError } from '@jitforms/js';

const form = createJitForm({
  formHash: 'abc123',
  timeout: 5000,
});

try {
  const result = await form.submit({ name: 'John' });
} catch (error) {
  if (error instanceof JitFormError) {
    console.error('Request timed out');
  }
}
```

## CORS Note

The JitForms server does not configure CORS headers. This SDK is designed to be used from the same origin as your JitForms instance, or from server-side environments (Node.js, edge functions) where CORS does not apply.

## License

MIT
