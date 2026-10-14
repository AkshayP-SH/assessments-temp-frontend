import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  });
}

// Polyfills for simple-peer compatibility
if (typeof global === 'undefined') {
  window.global = window;
}

// Override default window.alert with smart coloring
window.alert = (message) => {
  const options = {
    autoClose: 3000,
    position: "top-right",
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  };

  const str = String(message || '').toLowerCase();

  const isError = str.includes('fail') ||
                  str.includes('error') ||
                  str.includes('cannot') ||
                  str.includes('could not') ||
                  str.includes('invalid') ||
                  str.includes('not found') ||
                  str.includes('wrong') ||
                  str.includes('unauthorized') ||
                  str.includes('forbidden');

  const isSuccess = str.includes('success') ||
                    str.includes('sent') ||
                    str.includes('scheduled') ||
                    str.includes('created') ||
                    str.includes('updated') ||
                    str.includes('deleted') ||
                    str.includes('saved') ||
                    str.includes('added') ||
                    str.includes('removed') ||
                    str.includes('copied') ||
                    str.includes('done') ||
                    str.includes('complete');

  if (isError) {
    toast.error(message, options);
  } else if (isSuccess) {
    toast.success(message, options);
  } else {
    toast.info(message, options);
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>,
);