# @jitforms/react

React hooks for [JitForms](https://jitforms.com) - the simplest way to add form handling to your React app.

## Installation

```bash
npm install @jitforms/react
```

## Basic Usage

```tsx
import { useJitForm } from '@jitforms/react';

function ContactForm() {
  const { submit, isLoading, isSuccess, fieldError } = useJitForm('your-form-hash');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(Object.fromEntries(formData));
  };

  if (isSuccess) return <p>Thank you for your message!</p>;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" />
        {fieldError('name') && <span className="error">{fieldError('name')}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" />
        {fieldError('email') && <span className="error">{fieldError('email')}</span>}
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" />
        {fieldError('message') && <span className="error">{fieldError('message')}</span>}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

## With Validation Errors

Display all validation errors at once, or per-field:

```tsx
import { useJitForm } from '@jitforms/react';

function SignupForm() {
  const { submit, isLoading, isError, error, fieldErrors, fieldError } =
    useJitForm('your-form-hash');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(Object.fromEntries(formData));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show a global error message */}
      {isError && <div className="alert">{error?.message}</div>}

      {/* Show all field errors as a summary */}
      {isError && (
        <ul>
          {Object.entries(fieldErrors).map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`}>{msg}</li>
            ))
          )}
        </ul>
      )}

      <div>
        <input name="email" type="email" placeholder="Email" />
        {fieldError('email') && <span className="error">{fieldError('email')}</span>}
      </div>

      <div>
        <input name="password" type="password" placeholder="Password" />
        {fieldError('password') && <span className="error">{fieldError('password')}</span>}
      </div>

      <button type="submit" disabled={isLoading}>Sign Up</button>
    </form>
  );
}
```

## With Captcha

Pass a captcha token (e.g. from reCAPTCHA or Turnstile) via the options:

```tsx
import { useJitForm } from '@jitforms/react';
import { useState } from 'react';

function ProtectedForm() {
  const [captchaToken, setCaptchaToken] = useState('');

  const { submit, isLoading, isSuccess, fieldError } = useJitForm('your-form-hash', {
    captchaToken,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(Object.fromEntries(formData));
  };

  if (isSuccess) return <p>Submitted successfully!</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" />
      {fieldError('email') && <span className="error">{fieldError('email')}</span>}

      {/* Your captcha component */}
      <TurnstileWidget onVerify={setCaptchaToken} />

      <button type="submit" disabled={isLoading || !captchaToken}>Submit</button>
    </form>
  );
}
```

## With File Uploads

Files are supported directly via the `JitFormData` type:

```tsx
import { useJitForm } from '@jitforms/react';
import { useRef } from 'react';

function UploadForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { submit, isLoading, isSuccess, fieldError } = useJitForm('your-form-hash');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(Object.fromEntries(formData));
  };

  if (isSuccess) return <p>File uploaded!</p>;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" />
        {fieldError('name') && <span className="error">{fieldError('name')}</span>}
      </div>

      <div>
        <label htmlFor="resume">Resume (PDF)</label>
        <input id="resume" name="resume" type="file" accept=".pdf" ref={fileRef} />
        {fieldError('resume') && <span className="error">{fieldError('resume')}</span>}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

## Reset After Submission

Use `reset()` to allow the user to submit another response:

```tsx
import { useJitForm } from '@jitforms/react';

function FeedbackForm() {
  const { submit, isLoading, isSuccess, reset, fieldError } = useJitForm('your-form-hash');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(Object.fromEntries(formData));
  };

  if (isSuccess) {
    return (
      <div>
        <p>Thanks for your feedback!</p>
        <button onClick={reset}>Submit another response</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="feedback">Your feedback</label>
        <textarea id="feedback" name="feedback" />
        {fieldError('feedback') && <span className="error">{fieldError('feedback')}</span>}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Feedback'}
      </button>
    </form>
  );
}
```

## API Reference

### `useJitForm(formHash, options?)`

Returns a form handler bound to the given form hash.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `formHash` | `string` | Your JitForms form identifier |
| `options.baseUrl` | `string` | Custom API base URL (default: `'https://jitforms.com'`) |
| `options.honeypot` | `boolean \| string` | Enable honeypot spam protection |
| `options.captchaToken` | `string` | Captcha verification token |
| `options.headers` | `Record<string, string>` | Custom request headers |
| `options.timeout` | `number` | Request timeout in ms (default: `10000`) |

**Returns:**

| Property | Type | Description |
|---|---|---|
| `submit` | `(data: JitFormData) => Promise<JitFormResult>` | Submit form data |
| `isLoading` | `boolean` | `true` while a submission is in-flight |
| `isSuccess` | `boolean` | `true` after a successful submission |
| `isError` | `boolean` | `true` after a failed submission |
| `error` | `{ message: string; errors: Record<string, string[]> } \| null` | Error details |
| `submission` | `JitFormSubmission \| null` | The created submission on success |
| `redirectUrl` | `string \| undefined` | Redirect URL returned by the server |
| `reset` | `() => void` | Reset all state back to initial |
| `fieldErrors` | `Record<string, string[]>` | Shortcut to `error.errors` (empty object if no error) |
| `fieldError` | `(field: string) => string \| undefined` | Returns the first error message for a field |

## License

MIT
