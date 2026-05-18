// Performance monitoring for Language.fi Dashboard

// Track Core Web Vitals
function trackWebVitals() {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (typeof gtag === 'function') {
                    gtag('event', 'LCP', {
                        event_category: 'Web Vitals',
                        value: Math.round(entry.startTime),
                        event_label: 'Largest Contentful Paint'
                    });
                }
            }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Track First Input Delay (FID)
    if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (typeof gtag === 'function') {
                    gtag('event', 'FID', {
                        event_category: 'Web Vitals',
                        value: Math.round(entry.processingStart - entry.startTime),
                        event_label: 'First Input Delay'
                    });
                }
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    if ('PerformanceObserver' in window) {
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    if (typeof gtag === 'function') {
                        gtag('event', 'CLS', {
                            event_category: 'Web Vitals',
                            value: clsValue.toFixed(4),
                            event_label: 'Cumulative Layout Shift'
                        });
                    }
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Track Time to First Byte (TTFB)
    window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const ttfb = navigation.responseStart - navigation.requestStart;
            if (typeof gtag === 'function') {
                gtag('event', 'TTFB', {
                    event_category: 'Web Vitals',
                    value: Math.round(ttfb),
                    event_label: 'Time to First Byte'
                });
            }
        }
    });
}

// Track API performance
function trackAPIPerformance(url, duration, success) {
    if (typeof gtag === 'function') {
        gtag('event', 'api_call', {
            event_category: 'API Performance',
            event_label: url,
            value: Math.round(duration),
            custom_map: { success: success }
        });
    }
}

// Track page load time
function trackPageLoadTime() {
    window.addEventListener('load', () => {
        const perfData = performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        if (typeof gtag === 'function') {
            gtag('event', 'timing_complete', {
                event_category: 'Page Load',
                value: Math.round(pageLoadTime),
                event_label: 'Page Load Time'
            });
        }
    });
}

// Initialize performance monitoring
function initPerformanceMonitoring() {
    if (typeof PerformanceObserver !== 'undefined') {
        trackWebVitals();
        trackPageLoadTime();
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.LanguageFiPerformance = {
        trackAPIPerformance,
        initPerformanceMonitoring
    };
}

// Auto-initialize
initPerformanceMonitoring();
