export { init } from './jitforms-html';

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      import('./jitforms-html').then((mod) => mod.init());
    });
  } else {
    import('./jitforms-html').then((mod) => mod.init());
  }
}
