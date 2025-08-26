// Utility to debug aria-hidden issues
export class AriaDebugger {
  private observer: MutationObserver | null = null;
  
  static startDebugging() {
    const ariaDebugger = new AriaDebugger();
    ariaDebugger.watchAriaChanges();
    return ariaDebugger;
  }
  
  watchAriaChanges() {
    console.log('🔍 Starting ARIA debugging...');
    
    // Check initial state
    this.checkCurrentAriaState();
    
    // Watch for changes
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target as Element;
          const newValue = target.getAttribute('aria-hidden');
          const oldValue = mutation.oldValue;
          
          console.log('🚨 ARIA-HIDDEN CHANGED:', {
            element: target,
            tagName: target.tagName,
            id: target.id,
            className: target.className,
            oldValue,
            newValue,
            stack: new Error().stack
          });
          
          // If root gets aria-hidden, remove it immediately
          if (target.id === 'root' && newValue === 'true') {
            console.log('⚡ Removing aria-hidden from root immediately');
            target.removeAttribute('aria-hidden');
          }
        }
      });
    });
    
    this.observer.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      attributeFilter: ['aria-hidden']
    });
  }
  
  checkCurrentAriaState() {
    const elementsWithAriaHidden = document.querySelectorAll('[aria-hidden]');
    console.log('📋 Current elements with aria-hidden:', Array.from(elementsWithAriaHidden).map(el => ({
      element: el,
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      ariaHidden: el.getAttribute('aria-hidden')
    })));
  }
  
  stopDebugging() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('🔍 ARIA debugging stopped');
    }
  }
}

// Auto-prevent aria-hidden on root
export function preventRootAriaHidden() {
  const root = document.getElementById('root');
  if (!root) return;
  
  // Remove any existing aria-hidden
  root.removeAttribute('aria-hidden');
  
  // Set up a defensive mutation observer
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'aria-hidden' && 
          mutation.target === root) {
        console.log('🛡️ Prevented aria-hidden on root element');
        root.removeAttribute('aria-hidden');
      }
    });
  });
  
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['aria-hidden']
  });
  
  return observer;
}
