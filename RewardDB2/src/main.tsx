import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global protection against aria-hidden on root
function setupGlobalAriaProtection() {
  const root = document.getElementById('root');
  if (!root) return;
  
  // Force remove any aria-hidden immediately
  root.removeAttribute('aria-hidden');
  
  // Set up permanent protection
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'aria-hidden' && 
          mutation.target === root) {
        console.warn('🛡️ Prevented aria-hidden on root element');
        root.removeAttribute('aria-hidden');
      }
    });
  });
  
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['aria-hidden']
  });
  
  // Also prevent it with a direct property override
  Object.defineProperty(root, 'ariaHidden', {
    get: () => null,
    set: () => {
      console.warn('🛡️ Blocked attempt to set aria-hidden on root');
    },
    configurable: false
  });
}

// Initialize protection before React renders
setupGlobalAriaProtection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
