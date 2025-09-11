// Google Analytics utility functions
interface GtagConfig {
  page_location: string;
  page_title?: string;
}

interface GtagEvent {
  event_category: string;
  event_label?: string;
  value?: number;
}

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: GtagConfig | GtagEvent) => void;
  }
}

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-145NLGE1Y9', {
      page_location: url,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user interactions
export const trackUserAction = (action: string, details?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: 'user_interaction',
      ...details,
    });
  }
};

// Track authentication events
export const trackAuth = (action: 'login' | 'logout' | 'signup') => {
  trackEvent(action, 'authentication');
};

// Track prediction events
export const trackPrediction = (action: 'save' | 'clear' | 'view', details?: Record<string, string | number>) => {
  trackEvent(action, 'predictions', undefined, undefined);
  if (details) {
    trackUserAction(`prediction_${action}`, details);
  }
};