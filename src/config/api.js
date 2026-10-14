// API Configuration
// This ensures API calls work in both development and production

const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = (configuredApiUrl || (import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:5000')).replace(/\/+$/, '');

// Timeout for API requests (30 seconds for cold starts)
const API_TIMEOUT = 30000;

// Navigate inside SPA without forcing a full document reload.
const softNavigate = (path) => {
  if (window.location.pathname === path) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const isAuthEndpoint = (endpoint) => {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return (
    normalized.includes('/api/login') ||
    normalized.includes('/api/register') ||
    normalized.includes('/api/admin/login')
  );
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export base URL for direct use
export const API_URL = API_BASE_URL;

// Helper for fetch with automatic URL building and timeout
export const apiFetch = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const shouldHandleGlobalRedirect = !options.skipGlobalErrorRedirect && !isAuthEndpoint(endpoint);

  // Don't apply tight timeouts to upload routes or report generations
  const isLongRequest = endpoint.includes('/upload') || endpoint.includes('/export') || endpoint.includes('/predict') || endpoint.includes('/company-video');
  let timeoutDuration = isLongRequest ? 180000 : API_TIMEOUT;
  if (endpoint.includes('coding-questions/submit')) timeoutDuration = 300000;

  // If external signal provided, listen to it and abort our controller
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutDuration);

  try {
    const { default: apiClient } = await import('../utils/apiInterceptor');
    
    // Convert fetch options to axios config
    const isBinaryEndpoint = options.responseType === 'blob' || 
                             options.responseType === 'arraybuffer' ||
                             endpoint.includes('/export/students') || 
                             endpoint.includes('/export/results') || 
                             endpoint.includes('/violations/export') || 
                             endpoint.includes('/shortlisted-pdf');

    const axiosConfig = {
      method: options.method || 'GET',
      url: getApiUrl(endpoint),
      headers: options.headers || {},
      signal: controller.signal,
      data: options.body,
      timeout: timeoutDuration,
    };

    if (options.responseType) {
      axiosConfig.responseType = options.responseType;
    } else if (isBinaryEndpoint) {
      axiosConfig.responseType = 'blob';
    }
    
    // axios throws on non-2xx statuses, but fetch doesn't
    axiosConfig.validateStatus = () => true; 
    
    const axiosResponse = await apiClient(axiosConfig);
    
    // Mock the fetch Response object
    const response = {
      ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: new Headers(axiosResponse.headers),
      url: axiosResponse.config.url,
      json: async () => {
        if (axiosResponse.data instanceof Blob) {
          const text = await axiosResponse.data.text();
          return JSON.parse(text);
        }
        return axiosResponse.data;
      },
      text: async () => {
        if (axiosResponse.data instanceof Blob) {
          return await axiosResponse.data.text();
        }
        return typeof axiosResponse.data === 'string' ? axiosResponse.data : JSON.stringify(axiosResponse.data);
      },
      blob: async () => {
        if (axiosResponse.data instanceof Blob) {
          return axiosResponse.data;
        }
        return new Blob([axiosResponse.data]);
      },
      clone: function() { return { ...this }; },
    };

    // Check for maintenance mode (503 status)
    if (shouldHandleGlobalRedirect && response.status === 503 && !endpoint.includes('/settings/public')) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (data.code === 'MAINTENANCE') {
          localStorage.setItem('maintenance_message', data.message || '');
          if (window.location.pathname !== '/maintenance') {
            // Let admins bypass maintenance
            if (!window.location.pathname.startsWith('/admin')) {
              sessionStorage.setItem('redirect_after_recovery', window.location.pathname + window.location.search);
              softNavigate('/maintenance');
              return new Promise(() => { }); // prevent resolving so calling components don't crash
            }
          }
        }
      } catch (e) {
        // Ignore if parsing fails
      }
    }

    // Check for Quota Exceeded (403)
    if (shouldHandleGlobalRedirect && response.status === 403) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (data.quota) {
          window.dispatchEvent(new CustomEvent('quota_exceeded', { detail: data.quota }));
        }
      } catch (e) {
        // Ignore if parsing fails
      }
    }

    return response;
  } catch (error) {
    const isNetworkFailure =
      timedOut ||
      error?.name === 'TypeError' ||
      error?.name === 'AbortError' ||
      error?.code === 'ERR_NETWORK' ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT';

    if (shouldHandleGlobalRedirect && isNetworkFailure) {
      if (
        !endpoint.includes('/settings/public') &&
        window.location.pathname !== '/server-down' &&
        window.location.pathname !== '/maintenance'
      ) {
        sessionStorage.setItem('redirect_after_recovery', window.location.pathname + window.location.search);
        softNavigate('/server-down');
        return new Promise(() => { }); // block execution
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
