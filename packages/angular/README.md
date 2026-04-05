# @jitforms/angular

Angular service for [JitForms](https://jitforms.com) - wraps the `@jitforms/js` core SDK with RxJS observables for Angular applications. Works with Angular 17+ standalone components.

## Installation

```bash
npm install @jitforms/angular @jitforms/js
```

## Quick Start

### Basic usage with snapshot

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JitFormService } from '@jitforms/angular';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (state.isSuccess) {
      <p>Thank you for your submission!</p>
    } @else {
      <form (ngSubmit)="onSubmit($event)">
        <div>
          <label for="email">Email</label>
          <input id="email" name="email" [(ngModel)]="email" />
          @if (form.fieldError('email')) {
            <span class="error">{{ form.fieldError('email') }}</span>
          }
        </div>

        <div>
          <label for="message">Message</label>
          <textarea id="message" name="message" [(ngModel)]="message"></textarea>
          @if (form.fieldError('message')) {
            <span class="error">{{ form.fieldError('message') }}</span>
          }
        </div>

        <button type="submit" [disabled]="state.isLoading">
          {{ state.isLoading ? 'Sending...' : 'Submit' }}
        </button>
      </form>
    }
  `,
})
export class ContactComponent implements OnInit, OnDestroy {
  form = new JitFormService('your-form-hash');
  state = this.form.snapshot;
  email = '';
  message = '';

  ngOnInit() {
    this.form.state.subscribe((s) => (this.state = s));
  }

  async onSubmit(e: Event) {
    e.preventDefault();
    const result = await this.form.submit({
      email: this.email,
      message: this.message,
    });

    if (result.ok && result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  }

  ngOnDestroy() {
    this.form.destroy();
  }
}
```

### Using the async pipe

```ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JitFormService, type JitFormState } from '@jitforms/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-contact-async',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (state$ | async; as state) {
      @if (state.isSuccess) {
        <p>Thank you for your submission!</p>
      } @else {
        <form (ngSubmit)="onSubmit($event)">
          <div>
            <label for="email">Email</label>
            <input id="email" name="email" [(ngModel)]="email" />
            @if (state.error?.errors?.['email']?.[0]; as emailError) {
              <span class="error">{{ emailError }}</span>
            }
          </div>

          <button type="submit" [disabled]="state.isLoading">
            {{ state.isLoading ? 'Sending...' : 'Submit' }}
          </button>
        </form>
      }
    }
  `,
})
export class ContactAsyncComponent implements OnDestroy {
  form = new JitFormService('your-form-hash');
  state$: Observable<JitFormState> = this.form.state;
  email = '';

  async onSubmit(e: Event) {
    e.preventDefault();
    await this.form.submit({ email: this.email });
  }

  ngOnDestroy() {
    this.form.destroy();
  }
}
```

## API

### `JitFormService`

A plain TypeScript class (no Angular decorators) that wraps `@jitforms/js` with RxJS state management.

#### Constructor

```ts
new JitFormService(formHash: string, options?: JitFormServiceOptions)
```

| Parameter  | Type     | Description                                   |
| ---------- | -------- | --------------------------------------------- |
| `formHash` | `string` | Your form's unique hash identifier            |
| `options`  | `object` | Optional config: `baseUrl`, `honeypot`, `captchaToken`, `headers`, `timeout` |

#### Properties

| Property   | Type                      | Description                          |
| ---------- | ------------------------- | ------------------------------------ |
| `state`    | `Observable<JitFormState>` | Observable stream of form state      |
| `snapshot` | `JitFormState`            | Current state value (synchronous)    |

#### Methods

| Method                   | Return Type              | Description                              |
| ------------------------ | ------------------------ | ---------------------------------------- |
| `submit(data)`           | `Promise<JitFormResult>` | Submit form data                         |
| `fieldErrors()`          | `Record<string, string[]>` | All field validation errors            |
| `fieldError(field)`      | `string \| undefined`    | First validation error for a field       |
| `reset()`                | `void`                   | Reset state to initial values            |
| `destroy()`              | `void`                   | Complete the observable (call in ngOnDestroy) |

### `createJitFormService`

Factory function alternative to `new JitFormService(...)`.

```ts
import { createJitFormService } from '@jitforms/angular';

const form = createJitFormService('your-form-hash', {
  baseUrl: 'https://your-instance.com',
});
```

### `JitFormState`

```ts
interface JitFormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: { message: string; errors: Record<string, string[]> } | null;
  submission: JitFormSubmission | null;
  redirectUrl: string | undefined;
}
```

## Configuration Options

```ts
const form = new JitFormService('your-form-hash', {
  baseUrl: 'https://your-instance.com', // Custom JitForms instance
  honeypot: true,                        // Enable spam protection
  captchaToken: 'token',                 // Captcha token
  headers: { 'X-Custom': 'value' },      // Custom headers
  timeout: 5000,                          // Request timeout in ms
});
```

## License

MIT
