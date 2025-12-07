import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';

// CONFIGURACIÓN SENTRY - Versión actualizada
Sentry.init({
  dsn: "https://608dfb89ee52ac528ae19442fe6d5d24@o4510494262165504.ingest.us.sentry.io/4510494301487104",
  
  // Integraciones disponibles directamente desde @sentry/react
  integrations: [
    Sentry.browserTracingIntegration(), // ← Nueva forma
    Sentry.replayIntegration(), // ← Si quieres session replay
  ],
  
  // Configuración de Performance
  tracesSampleRate: 1.0,
  
  // Configuración de Session Replay (opcional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  environment: import.meta.env.MODE || 'development',
  sendDefaultPii: true,
  
  debug: false,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);