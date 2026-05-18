// Analytics tracking - Configure your tracking ID here
const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Replace with your Google Analytics 4 tracking ID

// Initialize Google Analytics
function initAnalytics() {
    if (typeof gtag === 'function' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
        gtag('js', new Date());
        gtag('config', GA_TRACKING_ID);
    }
}

// Track page view
function trackPageView(pageTitle, pageLocation) {
    if (typeof gtag === 'function' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
        gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: pageLocation
        });
    }
}

// Track custom event
function trackEvent(eventName, parameters) {
    if (typeof gtag === 'function' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
        gtag('event', eventName, parameters);
    }
}

// Track errors
function trackError(error, context) {
    if (typeof gtag === 'function' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
        gtag('event', 'error', {
            error_name: error.name,
            error_message: error.message,
            context: context
        });
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.LanguageFiAnalytics = {
        trackPageView,
        trackEvent,
        trackError,
        initAnalytics
    };
}
