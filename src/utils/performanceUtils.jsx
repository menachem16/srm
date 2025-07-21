// Performance optimization utilities
const PerformanceUtils = {
  // Debounce function to limit API calls
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  // Throttle function for scroll events
  throttle: (func, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy loading for images
  lazyLoadImage: (img, src) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.src = src;
          observer.unobserve(entry.target);
        }
      });
    });
    
    observer.observe(img);
  },

  // Memory cleanup helper
  cleanupResources: (resources) => {
    resources.forEach(resource => {
      if (resource && typeof resource.cleanup === 'function') {
        resource.cleanup();
      }
    });
  },

  // Batch API calls to reduce server load
  batchApiCalls: async (calls, batchSize = 5, delay = 100) => {
    const results = [];
    
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(call => call())
      );
      
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < calls.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }
};