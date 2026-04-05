# JitForms Integrations

Official frontend SDKs and integrations for [JitForms](https://jitforms.com) — form handling built for devs.

Add a form endpoint to any site in seconds. Collect submissions, block spam with AI, and trigger webhooks — no backend required.

## Packages

| Package | Description | Size |
|---------|-------------|------|
| [`@jitforms/js`](./packages/js) | Core JavaScript/TypeScript SDK — zero deps | ~1.6 KB |
| [`@jitforms/react`](./packages/react) | React hook (`useJitForm`) | ~1.0 KB |
| [`@jitforms/vue`](./packages/vue) | Vue 3 composable (`useJitForm`) | ~0.9 KB |
| [`@jitforms/html`](./packages/html) | Drop-in `<script>` tag — zero JS needed | ~2.9 KB |
| [`@jitforms/svelte`](./packages/svelte) | Svelte store + `use:jitform` action | ~2.0 KB |
| [`@jitforms/angular`](./packages/angular) | Service with RxJS observable state | ~1.0 KB |
| [`@jitforms/astro`](./packages/astro) | Astro component + client helper | ~1.0 KB |
| [`@jitforms/next`](./packages/next) | Next.js `formAction` hook + server actions | ~0.5 KB |

All sizes are minified (pre-gzip). Every package ships ESM + CJS + TypeScript declarations.

## Quick Start

### Pick your framework

**Vanilla JS / TypeScript**

```bash
npm install @jitforms/js
```

```ts
import { createJitForm } from '@jitforms/js';

const form = createJitForm({ formHash: 'your-form-hash' });
const result = await form.submit({ name: 'Jane', email: 'jane@example.com' });

if (result.ok) {
  console.log('Submitted!', result.submission);
} else {
  console.error(result.errors); // { email: ['The email field is required.'] }
}
```

**React**

```bash
npm install @jitforms/react
```

```tsx
import { useJitForm } from '@jitforms/react';

function ContactForm() {
  const { submit, isLoading, isSuccess, fieldError } = useJitForm('your-form-hash');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submit(Object.fromEntries(new FormData(e.currentTarget)));
  };

  if (isSuccess) return <p>Thank you!</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      {fieldError('email') && <span>{fieldError('email')}</span>}
      <button disabled={isLoading}>Send</button>
    </form>
  );
}
```

**Vue**

```bash
npm install @jitforms/vue
```

```vue
<script setup>
import { useJitForm } from '@jitforms/vue';

const { submit, isLoading, isSuccess, fieldError } = useJitForm('your-form-hash');

async function handleSubmit(e) {
  e.preventDefault();
  await submit(Object.fromEntries(new FormData(e.target)));
}
</script>

<template>
  <div v-if="isSuccess">Thank you!</div>
  <form v-else @submit="handleSubmit">
    <input name="email" type="email" />
    <span v-if="fieldError('email')">{{ fieldError('email') }}</span>
    <button :disabled="isLoading">Send</button>
  </form>
</template>
```

**HTML (no build step)**

```html
<script src="https://cdn.jsdelivr.net/npm/@jitforms/html/dist/jitforms.global.js"></script>

<form data-jitform="your-form-hash" data-jitform-honeypot>
  <input name="name" required />
  <span data-jitform-error="name"></span>

  <input name="email" type="email" required />
  <span data-jitform-error="email"></span>

  <button type="submit">Send</button>
  <div data-jitform-success style="display:none">Thank you!</div>
</form>
```

**Svelte**

```bash
npm install @jitforms/svelte
```

```svelte
<script>
  import { createJitForm } from '@jitforms/svelte';

  const form = createJitForm('your-form-hash');

  async function handleSubmit(e) {
    e.preventDefault();
    await $form.submit(Object.fromEntries(new FormData(e.target)));
  }
</script>

{#if $form.isSuccess}
  <p>Thank you!</p>
{:else}
  <form on:submit={handleSubmit}>
    <input name="email" type="email" />
    {#if $form.fieldError('email')}
      <span>{$form.fieldError('email')}</span>
    {/if}
    <button disabled={$form.isLoading}>Send</button>
  </form>
{/if}
```

**Angular**

```bash
npm install @jitforms/angular
```

```ts
import { Component, OnDestroy } from '@angular/core';
import { JitFormService } from '@jitforms/angular';

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `
    @if (state.isSuccess) {
      <p>Thank you!</p>
    } @else {
      <form (ngSubmit)="onSubmit()">
        <input name="email" [(ngModel)]="email" />
        @if (form.fieldError('email')) {
          <span>{{ form.fieldError('email') }}</span>
        }
        <button [disabled]="state.isLoading">Send</button>
      </form>
    }
  `,
})
export class ContactComponent implements OnDestroy {
  form = new JitFormService('your-form-hash');
  state = this.form.snapshot;
  email = '';

  constructor() {
    this.form.state.subscribe((s) => (this.state = s));
  }

  async onSubmit() {
    await this.form.submit({ email: this.email });
  }

  ngOnDestroy() {
    this.form.destroy();
  }
}
```

**Astro**

```bash
npm install @jitforms/astro
```

```astro
---
import JitForm from '@jitforms/astro/JitForm.astro';
---

<JitForm formHash="your-form-hash" honeypot>
  <input name="email" type="email" required />
  <span data-jitform-error="email"></span>
  <button type="submit">Subscribe</button>
  <p data-jitform-success style="display:none">Thanks!</p>
</JitForm>
```

**Next.js**

```bash
npm install @jitforms/next
```

```tsx
// Client component with formAction
'use client';
import { useJitFormAction } from '@jitforms/next';

export function ContactForm() {
  const { formAction, isLoading, isSuccess, fieldError } = useJitFormAction('your-form-hash');

  if (isSuccess) return <p>Thank you!</p>;

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      {fieldError('email') && <span>{fieldError('email')}</span>}
      <button disabled={isLoading}>Send</button>
    </form>
  );
}
```

```ts
// Server action (bypasses CORS)
'use server';
import { serverSubmitForm } from '@jitforms/next/server';

export async function submitContact(formData: FormData) {
  return serverSubmitForm('your-form-hash', {
    email: formData.get('email') as string,
  });
}
```

## Features

All packages share the same core capabilities from `@jitforms/js`:

- **Automatic content type** — sends JSON by default, switches to `multipart/form-data` when files are detected
- **Honeypot spam protection** — hidden field injected automatically
- **Captcha support** — pass tokens from reCAPTCHA v2/v3, hCaptcha, or Cloudflare Turnstile
- **Typed errors** — discriminated union result (`ok: true | false`) with per-field validation errors
- **Timeout handling** — configurable with `AbortController`, throws `JitFormError` on timeout
- **Zero dependencies** — core SDK uses native `fetch`, no polyfills needed
- **Tree-shakeable** — ESM + CJS dual exports, side-effect free

## Architecture

```
@jitforms/js          ← Core SDK (all packages depend on this)
├── @jitforms/react   ← useJitForm hook
├── @jitforms/vue     ← useJitForm composable
├── @jitforms/html    ← Standalone, no dependency on core (self-contained)
├── @jitforms/svelte  ← Store + action
├── @jitforms/angular ← Service with RxJS
├── @jitforms/astro   ← Component + client helper
└── @jitforms/next    ← Extends @jitforms/react + server actions
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/your-org/jitforms-integrations.git
cd jitforms-integrations
npm install
```

### Build

```bash
npm run build          # Build all packages
npm run clean          # Remove all dist/ folders
```

Packages are built in dependency order: `js` first, then framework packages in parallel, then `next` last.

### Test

```bash
npm test               # Run all 143 tests
npm run test:watch     # Watch mode
```

Tests use [Vitest](https://vitest.dev) with jsdom. Each package has its own test suite under `packages/*/tests/`.

| Package | Tests | Coverage |
|---------|-------|----------|
| `@jitforms/js` | 26 | submitForm, honeypot, captcha, createJitForm, JitFormError |
| `@jitforms/react` | 12 | Hook state, loading, success, error, fieldErrors, reset |
| `@jitforms/vue` | 11 | Composable refs, computed fieldErrors, reset, options |
| `@jitforms/html` | 14 | Auto-discovery, CSS classes, field errors, honeypot, redirect |
| `@jitforms/svelte` | 23 | Store subscribe/unsubscribe, action events, destroy, update |
| `@jitforms/angular` | 16 | BehaviorSubject state, observable, snapshot, destroy |
| `@jitforms/astro` | 14 | initForm, initAll, CSS classes, field errors |
| `@jitforms/next` | 19 | formAction, server submit, callbacks, auto-redirect |

### Project Structure

```
jitforms-integrations/
├── packages/
│   ├── js/             # Core SDK
│   │   ├── src/
│   │   │   ├── client.ts       # submitForm, createJitForm
│   │   │   ├── types.ts        # All shared TypeScript types
│   │   │   ├── errors.ts       # JitFormError class
│   │   │   └── index.ts
│   │   └── tests/
│   ├── react/          # React hook
│   │   ├── src/
│   │   │   ├── use-jit-form.ts
│   │   │   └── index.ts
│   │   └── tests/
│   ├── vue/            # Vue composable
│   │   ├── src/
│   │   │   ├── use-jit-form.ts
│   │   │   └── index.ts
│   │   └── tests/
│   ├── html/           # HTML embed script
│   │   ├── src/
│   │   │   ├── jitforms-html.ts
│   │   │   ├── global.ts
│   │   │   └── index.ts
│   │   └── tests/
│   ├── svelte/         # Svelte store + action
│   │   ├── src/
│   │   │   ├── create-jit-form.ts
│   │   │   ├── action.ts
│   │   │   └── index.ts
│   │   └── tests/
│   ├── angular/        # Angular service
│   │   ├── src/
│   │   │   ├── jit-form.service.ts
│   │   │   └── index.ts
│   │   └── tests/
│   ├── astro/          # Astro component
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   └── JitForm.astro
│   │   └── tests/
│   └── next/           # Next.js helpers
│       ├── src/
│       │   ├── use-jit-form-action.ts
│       │   ├── server-submit.ts
│       │   ├── index.ts
│       │   └── server.ts
│       └── tests/
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

## API Contract

All packages submit to the JitForms API:

```
POST /f/{formHash}
Content-Type: application/json (or multipart/form-data for files)
Accept: application/json
```

**Success (201)**

```json
{
  "data": {
    "id": "uuid",
    "data": { "name": "Jane", "email": "jane@example.com" },
    "is_spam": false,
    "created_at": "2026-04-02T10:00:00Z"
  },
  "redirect_url": "https://example.com/thanks"
}
```

**Validation Error (422)**

```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

No CSRF token is required. The `/f/*` endpoint is excluded from CSRF verification.

## CORS Note

The JitForms API does not set CORS headers by default. For cross-origin submissions from browsers, either:

1. Configure CORS on your JitForms instance
2. Use `@jitforms/next` server actions to proxy through your own server
3. Submit from the same origin

## License

MIT
