# JitForms Integrations

Official frontend SDKs for [JitForms](https://jitforms.com) — form handling built for devs.

Add a form endpoint to any site in seconds. Collect submissions, block spam with AI, and trigger webhooks — no backend required.

## Packages

| Package | Description | Size | Docs |
|---------|-------------|------|------|
| [`@jitforms/js`](./packages/js) | Core JavaScript/TypeScript SDK — zero deps | ~1.6 KB | [README](./packages/js/README.md) |
| [`@jitforms/react`](./packages/react) | React hook (`useJitForm`) | ~1.0 KB | [README](./packages/react/README.md) |
| [`@jitforms/vue`](./packages/vue) | Vue 3 composable (`useJitForm`) | ~0.9 KB | [README](./packages/vue/README.md) |
| [`@jitforms/svelte`](./packages/svelte) | Svelte store + `use:jitform` action | ~2.0 KB | [README](./packages/svelte/README.md) |
| [`@jitforms/angular`](./packages/angular) | Service with RxJS observable state | ~1.0 KB | [README](./packages/angular/README.md) |
| [`@jitforms/astro`](./packages/astro) | Astro component + client helper | ~1.0 KB | [README](./packages/astro/README.md) |
| [`@jitforms/next`](./packages/next) | Next.js `formAction` hook + server actions | ~0.5 KB | [README](./packages/next/README.md) |
| [`@jitforms/html`](./packages/html) | Drop-in `<script>` tag — zero JS needed | ~2.9 KB | [README](./packages/html/README.md) |

All sizes are minified (pre-gzip). Every package ships ESM + CJS + TypeScript declarations.

## Install

Pick the package that matches your stack and jump to its README for full usage:

```bash
npm install @jitforms/react      # or @jitforms/vue, @jitforms/svelte, etc.
```

Each framework package depends on `@jitforms/js` (auto-installed).

## Features

All packages share the same core capabilities from `@jitforms/js`:

- **Automatic content type** — sends JSON by default, switches to `multipart/form-data` when files are detected
- **Honeypot spam protection** — hidden field injected automatically
- **Captcha support** — pass tokens from reCAPTCHA v2/v3, hCaptcha, or Cloudflare Turnstile
- **Typed errors** — discriminated union result (`ok: true | false`) with per-field validation errors
- **Timeout handling** — configurable with `AbortController`, throws `JitFormError` on timeout
- **Zero dependencies** — core SDK uses native `fetch`, no polyfills needed
- **Tree-shakeable** — ESM + CJS dual exports, side-effect free

## API Contract

All packages submit to the JitForms API:

```
POST /f/{formHash}
Content-Type: application/json (or multipart/form-data for files)
Accept: application/json
```

**Success (201)** — `{ data: { id, data, is_spam, created_at }, redirect_url? }`
**Validation Error (422)** — `{ message, errors: { email: ["The email field is required."] } }`

CORS is enabled on `/f/*` so the SDKs work from any origin. No CSRF token required.

## Documentation

Full API reference and examples at [docs.jitforms.com](https://docs.jitforms.com).

## Development

### Prerequisites

Node.js 18+ and npm 9+.

### Setup

```bash
git clone https://github.com/jitforms/jitforms-integrations.git
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
npm test               # Run all 145 tests
npm run test:watch     # Watch mode
```

### Examples

The `examples/` directory contains runnable demo apps for each package — each is a minimal working integration you can copy from.

```bash
cd examples/react && npm run dev
```

### Project structure

```
jitforms-integrations/
├── packages/
│   ├── js/             # Core SDK (all other packages depend on this)
│   ├── react/          # useJitForm hook
│   ├── vue/            # useJitForm composable
│   ├── svelte/         # Store + action
│   ├── angular/        # Service with RxJS
│   ├── astro/          # Component + client helper
│   ├── next/           # Extends @jitforms/react + server actions
│   └── html/           # Standalone, self-contained
├── examples/           # One runnable demo per package
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

## License

MIT
