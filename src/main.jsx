import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.css';
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './contexts/auth/authContext.jsx'
import { ApiProvider } from './context/api_context.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ApiProvider>
          <App />
        </ApiProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Register service worker (if available)
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('Service worker registrado');
    }).catch(err => console.warn('SW register failed', err));
  });
}
*/
