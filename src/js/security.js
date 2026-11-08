export function initSecurity() {
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }

  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);
    if (window.logger) {
      window.logger.error(`Unexpected error: ${event.error?.message || event.message}`);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise]', event.reason);
    if (window.logger) {
      window.logger.error('Unhandled promise rejection');
    }
    event.preventDefault();
  });

  window.ProcessingRateLimiter = {
    lastProcessTime: 0,
    minInterval: 500,
    canProcess() {
      const now = Date.now();
      if (now - this.lastProcessTime < this.minInterval) return false;
      this.lastProcessTime = now;
      return true;
    },
  };

  window.ActiveObjectURLManager = {
    urls: new Set(),
    create(file) {
      const url = URL.createObjectURL(file);
      this.urls.add(url);
      return url;
    },
    revoke(url) {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {
        /* empty */
      }
      this.urls.delete(url);
    },
    revokeAll() {
      this.urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (_) {
          /* empty */
        }
      });
      this.urls.clear();
    },
  };

  console.log('%c[Security] Production hardening layer initialized', 'color:#34c759');
}
