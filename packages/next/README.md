# @jitforms/next

Next.js server actions and helpers for [JitForms](https://jitforms.com). Provides a client-side hook for form submissions and a server-side function for Server Actions and Route Handlers.

## Installation

```bash
npm install @jitforms/next
```

## Client Component with `useJitFormAction`

The `useJitFormAction` hook extends `useJitForm` from `@jitforms/react` with a `formAction` handler compatible with Next.js `<form action={...}>` pattern.

```tsx
'use client';

import { useJitFormAction } from '@jitforms/next';

export function ContactForm() {
  const { formAction, isLoading, isSuccess, fieldError } = useJitFormAction('abc123', {
    onSuccess: () => console.log('Submitted!'),
  });

  if (isSuccess) return <p>Thank you!</p>;

  return (
    <form action={formAction}>
      <input name="email" />
      {fieldError('email') && <span>{fieldError('email')}</span>}
      <button disabled={isLoading}>Submit</button>
    </form>
  );
}
```

## Server Action

Use `serverSubmitForm` in Server Actions to submit forms from the server side, bypassing CORS entirely.

```ts
// app/actions.ts
'use server';

import { serverSubmitForm } from '@jitforms/next/server';

export async function submitContact(formData: FormData) {
  const result = await serverSubmitForm('abc123', {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  });

  if (!result.ok) {
    return { errors: result.errors };
  }

  return { success: true };
}
```

## Route Handler

```ts
// app/api/contact/route.ts
import { serverSubmitForm } from '@jitforms/next/server';

export async function POST(request: Request) {
  const data = await request.json();
  const result = await serverSubmitForm('abc123', data);
  return Response.json(result);
}
```

## API

### `useJitFormAction(formHash, options?)`

Returns everything from `useJitForm` plus:

- `formAction(formData: FormData) => Promise<void>` - Handler for `<form action={formAction}>`

Options:

- `onSuccess` - Callback on successful submission
- `onError` - Callback on failed submission
- `autoRedirect` - Auto-redirect if `redirect_url` is present (default: `true`)
- All options from `@jitforms/js` `JitFormConfig` (except `formHash`)

### `serverSubmitForm(formHash, data, options?)`

Server-side form submission function.

Options:

- `serverUrl` - Override the base URL for server-side requests (useful for internal networking)
- All options from `@jitforms/js` `JitFormConfig` (except `formHash`)
