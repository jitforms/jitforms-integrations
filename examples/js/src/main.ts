import { createJitForm, JitFormError } from '@jitforms/js';

const form = createJitForm({
  baseUrl: 'https://jitforms.test',
  formHash: 'Jve1ZElW',
  honeypot: true,
});

const root = document.getElementById('root')!;

function render(state: 'idle' | 'loading' | 'success' | 'fail', extra?: unknown) {
  if (state === 'success') {
    root.innerHTML = `<div class="success">✓ Submitted successfully.</div>
      <pre style="font-size:0.75rem;overflow:auto">${JSON.stringify(extra, null, 2)}</pre>
      <button id="reset">Submit again</button>`;
    document.getElementById('reset')!.onclick = () => render('idle');
    return;
  }
  if (state === 'fail') {
    root.innerHTML = `<div class="fail">Failed: ${String(extra)}</div>
      <button id="reset">Try again</button>`;
    document.getElementById('reset')!.onclick = () => render('idle');
    return;
  }

  root.innerHTML = `
    <form id="contact">
      <div>
        <label for="name">Name</label>
        <input id="name" name="name" required />
        <div class="error" data-error="name"></div>
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required />
        <div class="error" data-error="email"></div>
      </div>
      <div>
        <label for="message">Message</label>
        <textarea id="message" name="message" required></textarea>
        <div class="error" data-error="message"></div>
      </div>
      <button type="submit"${state === 'loading' ? ' disabled' : ''}>
        ${state === 'loading' ? 'Sending…' : 'Send'}
      </button>
    </form>`;

  document.getElementById('contact')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string, string>;
    render('loading');
    document.querySelectorAll('[data-error]').forEach((el) => (el.textContent = ''));

    try {
      const result = await form.submit(data);
      if (result.ok) {
        render('success', result.submission);
      } else {
        render('idle');
        for (const [field, messages] of Object.entries(result.errors)) {
          const el = document.querySelector(`[data-error="${field}"]`);
          if (el) el.textContent = messages[0];
        }
      }
    } catch (err) {
      render('fail', err instanceof JitFormError ? err.message : err);
    }
  });
}

render('idle');
