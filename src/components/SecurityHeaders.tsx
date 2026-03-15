import { useEffect } from 'react';

/**
 * **PHASE 2: ENHANCED AUTHENTICATION SECURITY**
 * Component that sets security headers to prevent XSS and other attacks
 */
export const SecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy via meta tag (backup for applications)
    const cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    cspMeta.setAttribute('content', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://tzvuzruustalqqbkanat.supabase.co https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://tzvuzruustalqqbkanat.supabase.co wss://tzvuzruustalqqbkanat.supabase.co https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; '));

    // Set X-Content-Type-Options
    const noSniffMeta = document.createElement('meta');
    noSniffMeta.setAttribute('http-equiv', 'X-Content-Type-Options');
    noSniffMeta.setAttribute('content', 'nosniff');

    // Set X-Frame-Options
    const frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.setAttribute('http-equiv', 'X-Frame-Options');
    frameOptionsMeta.setAttribute('content', 'DENY');

    // Set Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.setAttribute('name', 'referrer');
    referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');

    // Append to head
    document.head.appendChild(cspMeta);
    document.head.appendChild(noSniffMeta);
    document.head.appendChild(frameOptionsMeta);
    document.head.appendChild(referrerMeta);

    // Set additional security measures
    
    // Disable right-click context menu in production (optional)
    const handleContextMenu = (e: MouseEvent) => {
      if (import.meta.env.PROD) {
        e.preventDefault();
      }
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+U in production (optional)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (import.meta.env.PROD) {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
        }
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Remove meta tags (optional cleanup)
      try {
        document.head.removeChild(cspMeta);
        document.head.removeChild(noSniffMeta);
        document.head.removeChild(frameOptionsMeta);
        document.head.removeChild(referrerMeta);
      } catch (error) {
        // Ignore errors if elements were already removed
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SecurityHeaders;