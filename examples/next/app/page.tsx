'use client';
import { useJitFormAction } from '@jitforms/next';

export default function Page() {
  const { formAction, isLoading, isSuccess, isError, fieldError, submission, reset } = useJitFormAction('Jve1ZElW', {
    baseUrl: 'https://jitforms.test',
    honeypot: true,
  });

  return (
    <>
      <h1>Next.js — @jitforms/next</h1>
      <p className="sub"><code>useJitFormAction</code> on <code>jitforms.test</code>.</p>
      {isSuccess ? (
        <>
          <div className="success">✓ Submitted successfully.</div>
          <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(submission, null, 2)}</pre>
          <button onClick={reset}>Submit again</button>
        </>
      ) : (
        <form action={formAction}>
          {isError && <div className="fail">Something went wrong.</div>}
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" />
            {fieldError('name') && <div className="error">{fieldError('name')}</div>}
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" />
            {fieldError('email') && <div className="error">{fieldError('email')}</div>}
          </div>
          <div>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" />
            {fieldError('message') && <div className="error">{fieldError('message')}</div>}
          </div>
          <button type="submit" disabled={isLoading}>{isLoading ? 'Sending…' : 'Send'}</button>
        </form>
      )}
    </>
  );
}
