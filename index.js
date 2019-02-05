import { CancelToken } from 'axios';
import RequestManager from './lib/RequestManager';
import CacheManager from './lib/CacheManager';
import extend from './lib/extend';
import lifeCycle from './lib/lifeCycle';

/**
 * @param {String} event
 * @param {context} options
 * @params {AxiosRequestConfig} options.config
 * @params {Object} options.payload
 */
const dispatchConfigEvent = function(event, { config, payload }) {
  if (config.hasOwnProperty(event) && typeof config[event] === 'function') {
    config[event](payload);
  }
};

export default function patchAxios(axios, vue, options) {
  const defaults = {
    debug: false
  };
  const settings = extend({}, defaults, options);

  const requestManager = new RequestManager(settings);

  const cacheManager = new CacheManager(settings);

  // Mount global mixin on Vue root instance
  vue.mixin(lifeCycle);

  /**
   * Global request interceptor
   * Any request with a `requestId` key in the config will be:
   *  - cancelled if already sent
   *  - added to the `pendingRequests` hash if not, with a cancel function
   */
  axios.interceptors.request.use(config => {
    let { requestId, context } = config;

    if (context && !requestId) {
      config.requestId = requestId = 'auto-generated-id-' + Math.floor(Math.random() * 100000000);
    }

    if (requestId && cacheManager.isCacheable(config)) {
      const cachedResponseData = cacheManager.getResponse(requestId);
      if (cachedResponseData !== null) {
        // Replace default request adapter so it returns the cached response immediately
        config.adapter = () => {
          return Promise.resolve({
            data: cachedResponseData,
            status: config.status,
            statusText: config.statusText,
            headers: config.headers,
            config: Object.assign({ __cached: true }, config),
            request: config
          });
        };
      } else {
        dispatchConfigEvent('onRequestStart', { config: config, payload: config });
        const source = CancelToken.source();
        config.cancelToken = source.token;
        requestManager.addRequest(requestId, context, source.cancel);
      }
    }
    return config;
  });

  /**
   * Global response interceptor
   * Check for the `requestId` and remove it from the `pendingRequests` hash
   */
  axios.interceptors.response.use(response => {
    const { requestId, context, __cached } = response.config;
    if (requestId && !__cached) {
      requestManager.removeRequest(requestId, context);
      if (cacheManager.isValidResponse(response)) {
        cacheManager.addResponse(requestId, response);
      }
      dispatchConfigEvent('onRequestComplete', {
        config: response.config,
        payload: response
      });
    }
    return response;
  });

  /**
   * Global axios method to cancel a single request by ID
   * @param requestIdOrContext: string
   * @param reason
   */
  axios.cancel = (requestIdOrContext, reason) => {
    if (requestIdOrContext) {
      requestManager.cancelRequest(requestIdOrContext, reason);
    }
  };

  /**
   * Global axios method to cancel all requests
   */
  axios.cancelAll = reason => {
    requestManager.cancelAllRequests(reason);
  };

  /**
   * Global axios method to clear all cached requests
   */
  axios.clearCache = requestId => {
    cacheManager.removeResponse(requestId);
  };

  /**
   * Global axios method to clear all cached requests
   */
  axios.clearAllCache = reason => {
    requestManager.cancelAllRequests(reason);
  };
}
