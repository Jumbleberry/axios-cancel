import { CancelToken } from 'axios';
import RequestManager from './lib/RequestManager';
import extend from './lib/extend';
import lifeCycle from './lib/lifeCycle';

export default function patchAxios(axios, vue, options) {

  const defaults = {
    debug: false,
  };
  const settings = extend({}, defaults, options);

  const requestManager = new RequestManager(settings);

  // Mount global mixin on Vue root instance
  vue.mixin(lifeCycle);

  /**
   * Global request interceptor
   * Any request with a `requestId` key in the config will be:
   *  - cancelled if already sent
   *  - added to the `pendingRequests` hash if not, with a cancel function
   */
  axios.interceptors.request.use((config) => {
    const { requestId, context } = config;
    if (requestId) {
      const source = CancelToken.source();
      config.cancelToken = source.token;
      requestManager.addRequest(requestId, context, source.cancel);
    }
    return config;
  });

  /**
   * Global response interceptor
   * Check for the `requestId` and remove it from the `pendingRequests` hash
   */
  axios.interceptors.response.use((response) => {
    const { requestId, context } = response.config;
    if (requestId) {
      requestManager.removeRequest(requestId, context);
    }
    return response;
  });


  /**
   * Cancel all pending requests from the component
   * @param uid: string
   */
  axios.cancelComponentPendingRequests = (context) => {
    for (let requestId in requestManager.getContextMapping()[context]) {
      axios.cancel(requestId, context)
    }
  };

  /**
   * Global axios method to cancel a single request by ID
   * @param requestId: string
   * @param reason
   */
  axios.cancel = (requestId, context, reason) => {
    if (requestId) {
      requestManager.cancelRequest(requestId, context, reason);
    }
  };

  /**
   * Global axios method to cancel all requests
   */
  axios.cancelAll = (reason) => {
    requestManager.cancelAllRequests(reason)
  };
}
