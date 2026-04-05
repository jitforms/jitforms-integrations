# @jitforms/svelte

Svelte integration for [JitForms](https://jitforms.com) -- wraps the `@jitforms/js` core SDK with a Svelte-compatible store and a form action.

Works with both Svelte 4 and Svelte 5.

## Installation

```bash
npm install @jitforms/svelte @jitforms/js
```

## Store Approach

Use `createJitForm` to get a Svelte-compatible store with `$store` auto-subscription syntax.

```svelte
<script>
  import { createJitForm } from '@jitforms/svelte';

  const form = createJitForm('abc123');

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    await $form.submit(Object.fromEntries(data));
  }
</script>

{#if $form.isSuccess}
  <p>Thank you! Your submission has been received.</p>
{:else}
  <form on:submit={handleSubmit}>
    <div>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" />
      {#if $form.fieldError('email')}
        <span class="error">{$form.fieldError('email')}</span>
      {/if}
    </div>

    <div>
      <label for="message">Message</label>
      <textarea id="message" name="message"></textarea>
      {#if $form.fieldError('message')}
        <span class="error">{$form.fieldError('message')}</span>
      {/if}
    </div>

    <button type="submit" disabled={$form.isLoading}>
      {$form.isLoading ? 'Submitting...' : 'Submit'}
    </button>

    {#if $form.isError}
      <p class="error">{$form.error.message}</p>
    {/if}
  </form>
{/if}
```

### Advanced Configuration

```svelte
<script>
  import { createJitForm } from '@jitforms/svelte';

  const form = createJitForm({
    formHash: 'abc123',
    baseUrl: 'https://your-instance.jitforms.com',
    honeypot: true,
    timeout: 15000,
  });
</script>
```

### Resetting State

```svelte
<script>
  // After showing a success message, reset to show the form again
  function handleReset() {
    $form.reset();
  }
</script>
```

## Action Approach

Use the `jitform` action for progressive form enhancement with zero boilerplate.

```svelte
<script>
  import { jitform } from '@jitforms/svelte';

  function handleSuccess(e) {
    console.log('Submitted!', e.detail.submission);
    if (e.detail.redirectUrl) {
      window.location.href = e.detail.redirectUrl;
    }
  }

  function handleError(e) {
    console.error('Failed:', e.detail.message, e.detail.errors);
  }
</script>

<form
  use:jitform={'abc123'}
  on:jitform:success={handleSuccess}
  on:jitform:error={handleError}
>
  <input name="email" type="email" placeholder="Email" />
  <textarea name="message" placeholder="Message"></textarea>
  <button type="submit">Submit</button>
</form>
```

### Action with Config Object

```svelte
<form use:jitform={{ formHash: 'abc123', honeypot: true }}>
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>
```

### CSS Classes

The action automatically toggles CSS classes on the form element:

| Class | When |
|---|---|
| `jf-loading` | Submission is in progress |
| `jf-success` | Submission succeeded |
| `jf-error` | Submission failed |

```css
form.jf-loading button[type="submit"] {
  opacity: 0.5;
  pointer-events: none;
}

form.jf-error {
  border-color: red;
}
```

### Custom Events

| Event | Detail |
|---|---|
| `jitform:loading` | (none) |
| `jitform:success` | `{ submission, redirectUrl }` |
| `jitform:error` | `{ message, errors, status }` |

## API Reference

### `createJitForm(formHashOrConfig)`

Creates a Svelte-compatible store for form submission state management.

**Parameters:**
- `formHashOrConfig` -- A form hash string or a `JitFormConfig` object.

**Returns:** `JitFormStore` with:
- `isLoading` -- Whether a submission is in progress
- `isSuccess` -- Whether the last submission succeeded
- `isError` -- Whether the last submission failed
- `error` -- Error details (`{ message, errors }`) or `null`
- `submission` -- The submission data on success, or `null`
- `redirectUrl` -- Optional redirect URL from the server
- `fieldErrors` -- Shorthand for `error.errors` (always an object)
- `fieldError(field)` -- Returns the first error message for a field, or `undefined`
- `submit(data)` -- Submit form data
- `reset()` -- Reset store to initial state
- `subscribe(fn)` -- Svelte store contract

### `jitform(node, config)`

Svelte action for declarative form enhancement.

**Parameters:**
- `node` -- The `<form>` element
- `config` -- A form hash string or a `JitFormConfig` object

## License

MIT
