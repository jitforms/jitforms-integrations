# @jitforms/astro

Astro integration for [JitForms](https://jitforms.com). Works in both static and island (`client:*`) modes.

## Installation

```bash
npm install @jitforms/astro
```

## Usage

### Using the Astro Component

```astro
---
import JitForm from '@jitforms/astro/JitForm.astro';
---

<JitForm formHash="abc123" honeypot redirect="/thank-you">
  <label>Email <input name="email" type="email" required /></label>
  <span data-jitform-error="email"></span>
  <button type="submit">Subscribe</button>
  <p data-jitform-success style="display:none">Thanks!</p>
</JitForm>
```

### Using the Client Helper Directly

```astro
<form id="contact" data-jitform="abc123">
  <input name="email" />
  <button type="submit">Send</button>
</form>

<script>
  import { initForm } from '@jitforms/astro';
  const form = document.getElementById('contact') as HTMLFormElement;
  initForm(form, 'abc123');
</script>
```

### Auto-Initialization

Any form with a `data-jitform` attribute is automatically initialized when using the `JitForm.astro` component or calling `initAll()`:

```astro
<script>
  import { initAll } from '@jitforms/astro';
  document.addEventListener('DOMContentLoaded', initAll);
</script>
```

## Props

| Prop       | Type      | Default | Description                          |
| ---------- | --------- | ------- | ------------------------------------ |
| `formHash` | `string`  | —       | Your JitForms form hash (required)   |
| `baseUrl`  | `string`  | —       | Custom API base URL                  |
| `honeypot` | `boolean` | `false` | Enable honeypot spam protection      |
| `redirect` | `string`  | —       | URL to redirect to after submission  |
| `class`    | `string`  | —       | CSS class for the form element       |

## CSS Classes

The form element receives these classes automatically during submission:

- `jf-loading` — while the submission is in progress
- `jf-success` — after a successful submission
- `jf-error` — after a validation error

## Data Attributes

- `data-jitform-error="fieldName"` — element to display validation errors for a field
- `data-jitform-success` — element shown on successful submission (initially hidden with `display:none`)

## License

MIT
