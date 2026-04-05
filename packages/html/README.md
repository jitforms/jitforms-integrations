# @jitforms/html

Drop-in `<script>` tag that auto-enhances HTML forms with `data-jitform` attribute. Zero JS knowledge needed. Works with static sites, WordPress, Webflow, and any HTML page.

## Installation

### CDN (recommended)

```html
<script src="https://cdn.jsdelivr.net/npm/@jitforms/html/dist/jitforms.global.js"></script>
```

Or via unpkg:

```html
<script src="https://unpkg.com/@jitforms/html/dist/jitforms.global.js"></script>
```

### npm

```bash
npm install @jitforms/html
```

```js
import { init } from '@jitforms/html';

// Auto-runs on DOMContentLoaded, but you can also call manually:
init();
```

## Quick Start

Add a single `data-jitform` attribute with your form hash to any HTML form:

```html
<script src="https://cdn.jsdelivr.net/npm/@jitforms/html/dist/jitforms.global.js"></script>

<form data-jitform="abc123" data-jitform-honeypot>
  <div>
    <label>Name</label>
    <input name="name" required />
    <span data-jitform-error="name"></span>
  </div>
  <div>
    <label>Email</label>
    <input name="email" type="email" required />
    <span data-jitform-error="email"></span>
  </div>
  <div>
    <label>Message</label>
    <textarea name="message"></textarea>
    <span data-jitform-error="message"></span>
  </div>
  <button type="submit">Send</button>
  <div data-jitform-success style="display:none">Thank you!</div>
</form>
```

That's it. No JavaScript to write. The script auto-discovers forms on page load and handles everything.

## Data Attributes

| Attribute | Placed on | Description |
|---|---|---|
| `data-jitform="HASH"` | `<form>` | **Required.** Your form hash identifier. |
| `data-jitform-url="URL"` | `<form>` | Custom base URL (default: `https://jitforms.com`). |
| `data-jitform-redirect="/path"` | `<form>` | Redirect to this URL on successful submission. |
| `data-jitform-honeypot` | `<form>` | Enable honeypot spam protection (presence = enabled). |
| `data-jitform-success` | Any element | Element to show on success (should be hidden by default). |
| `data-jitform-error="fieldName"` | Any element | Element to display validation errors for the named field. |

## CSS Classes

The script adds CSS classes to the form during its lifecycle so you can style each state:

| Class | Applied to | When |
|---|---|---|
| `.jf-loading` | `<form>` | During submission (removed after response). |
| `.jf-success` | `<form>` | After a successful submission. |
| `.jf-error` | `<form>` | After a failed submission. |
| `.jf-field-error` | Error elements | On individual `[data-jitform-error]` elements with errors. |

## Styling Examples

### Loading spinner on submit button

```css
.jf-loading button[type="submit"] {
  opacity: 0.6;
  pointer-events: none;
}

.jf-loading button[type="submit"]::after {
  content: " ...";
}
```

### Field error styling

```css
.jf-field-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}
```

### Success state

```css
.jf-success {
  opacity: 0.7;
  pointer-events: none;
}

[data-jitform-success] {
  color: #16a34a;
  font-weight: 600;
  padding: 1rem 0;
}
```

### Hide form fields on success

```css
.jf-success > *:not([data-jitform-success]) {
  display: none;
}
```

## How It Works

1. On page load, the script finds all `<form>` elements with `data-jitform`.
2. It hijacks the form's submit event and sends data via `POST /f/{hash}` as JSON (or FormData if the form contains file inputs).
3. On **success** (201): adds `.jf-success` class, shows the `[data-jitform-success]` element, and redirects if configured.
4. On **validation error** (422): adds `.jf-error` class, injects error messages into matching `[data-jitform-error="fieldName"]` elements.
5. On **network error**: adds `.jf-error` class and logs to console.

## API

### `JitForms.init()`

Manually discover and bind forms. Useful if forms are added to the DOM after page load (e.g., in a SPA or after an AJAX call).

```js
// After dynamically adding a form to the page:
JitForms.init();
```

## License

MIT
