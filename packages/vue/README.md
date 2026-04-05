# @jitforms/vue

Vue 3 composables for [JitForms](https://jitforms.com). Wraps the `@jitforms/js` core SDK with Vue reactive primitives.

## Installation

```bash
npm install @jitforms/vue
```

## Quick Start

```vue
<script setup>
import { useJitForm } from '@jitforms/vue';

const { submit, isLoading, isSuccess, fieldError } = useJitForm('abc123');

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  await submit(Object.fromEntries(formData));
}
</script>

<template>
  <div v-if="isSuccess">Thank you!</div>
  <form v-else @submit="handleSubmit">
    <input name="email" />
    <span v-if="fieldError('email')">{{ fieldError('email') }}</span>
    <button :disabled="isLoading">Submit</button>
  </form>
</template>
```

## API

### `useJitForm(formHash, options?)`

Returns a composable with reactive state and a `submit` function.

#### Parameters

| Parameter  | Type                 | Description                              |
| ---------- | -------------------- | ---------------------------------------- |
| `formHash` | `string`             | Your form's unique hash identifier       |
| `options`  | `UseJitFormOptions?` | Optional configuration (see below)       |

#### Options

| Option         | Type                       | Description                                      |
| -------------- | -------------------------- | ------------------------------------------------ |
| `baseUrl`      | `string?`                  | Override API base URL (default: `https://jitforms.com`) |
| `honeypot`     | `boolean \| string?`       | Enable honeypot spam protection                  |
| `captchaToken` | `string?`                  | Captcha token to include with submission         |
| `headers`      | `Record<string, string>?`  | Custom headers to include                        |
| `timeout`      | `number?`                  | Request timeout in ms (default: `10000`)         |

#### Return Value

| Property      | Type                                                              | Description                                      |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| `submit`      | `(data: JitFormData) => Promise<JitFormResult>`                   | Submit form data                                 |
| `isLoading`   | `Ref<boolean>`                                                    | `true` while a submission is in progress         |
| `isSuccess`   | `Ref<boolean>`                                                    | `true` after a successful submission             |
| `isError`     | `Ref<boolean>`                                                    | `true` after a failed submission                 |
| `error`       | `Ref<{ message: string; errors: Record<string, string[]> } \| null>` | Error details after a failed submission     |
| `submission`  | `Ref<JitFormSubmission \| null>`                                  | The submission data after success                |
| `redirectUrl` | `Ref<string \| undefined>`                                       | Redirect URL returned by the server, if any      |
| `reset`       | `() => void`                                                      | Reset all state back to initial values           |
| `fieldErrors` | `ComputedRef<Record<string, string[]>>`                           | All field validation errors                      |
| `fieldError`  | `(field: string) => string \| undefined`                          | Get the first error message for a specific field |

## Examples

### With Validation Errors

```vue
<script setup>
import { useJitForm } from '@jitforms/vue';

const { submit, isLoading, isError, error, fieldError } = useJitForm('abc123');

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  await submit(Object.fromEntries(formData));
}
</script>

<template>
  <form @submit="handleSubmit">
    <div v-if="isError && error" class="error">{{ error.message }}</div>

    <div>
      <label for="name">Name</label>
      <input id="name" name="name" />
      <span v-if="fieldError('name')" class="field-error">{{ fieldError('name') }}</span>
    </div>

    <div>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" />
      <span v-if="fieldError('email')" class="field-error">{{ fieldError('email') }}</span>
    </div>

    <button :disabled="isLoading" type="submit">
      {{ isLoading ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>
```

### With Redirect Handling

```vue
<script setup>
import { watch } from 'vue';
import { useJitForm } from '@jitforms/vue';

const { submit, isSuccess, redirectUrl } = useJitForm('abc123');

watch(redirectUrl, (url) => {
  if (url) {
    window.location.href = url;
  }
});

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  await submit(Object.fromEntries(formData));
}
</script>

<template>
  <div v-if="isSuccess">Redirecting...</div>
  <form v-else @submit="handleSubmit">
    <input name="email" />
    <button type="submit">Subscribe</button>
  </form>
</template>
```

### With Spam Protection

```vue
<script setup>
import { useJitForm } from '@jitforms/vue';

const { submit, isLoading, isSuccess } = useJitForm('abc123', {
  honeypot: true,
});

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  await submit(Object.fromEntries(formData));
}
</script>

<template>
  <div v-if="isSuccess">Thanks!</div>
  <form v-else @submit="handleSubmit">
    <input name="email" />
    <button :disabled="isLoading">Submit</button>
  </form>
</template>
```

### Resetting the Form

```vue
<script setup>
import { useJitForm } from '@jitforms/vue';

const { submit, isSuccess, reset } = useJitForm('abc123');

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  await submit(Object.fromEntries(formData));
}
</script>

<template>
  <div v-if="isSuccess">
    <p>Thank you!</p>
    <button @click="reset">Submit another</button>
  </div>
  <form v-else @submit="handleSubmit">
    <input name="email" />
    <button type="submit">Submit</button>
  </form>
</template>
```

## License

MIT
