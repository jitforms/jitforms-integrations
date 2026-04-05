import React from 'react';
import ReactDOM from 'react-dom/client';
import { useJitForm } from '@jitforms/react';

function App() {
  const { submit, isLoading, isSuccess, isError, fieldError, submission, reset } = useJitForm('Jve1ZElW', {
    baseUrl: 'https://jitforms.test',
    honeypot: true,
  });

  if (isSuccess) {
    return (
      <>
        <div className="success">✓ Submitted successfully.</div>
        <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(submission, null, 2)}</pre>
        <button onClick={reset}>Submit again</button>
      </>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        await submit(data);
      }}
    >
      {isError && <div className="fail">Something went wrong.</div>}
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
        {fieldError('name') && <div className="error">{fieldError('name')}</div>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        {fieldError('email') && <div className="error">{fieldError('email')}</div>}
      </div>
      <div>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" required />
        {fieldError('message') && <div className="error">{fieldError('message')}</div>}
      </div>
      <button type="submit" disabled={isLoading}>{isLoading ? 'Sending…' : 'Send'}</button>
    </form>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
