export default class CacheManager {
  /**
   * @param {AxiosRequestConfig} options
   */
  constructor(options) {
    this.options = Object.assign(
      {
        cache_prefix: 'axios-cache-',
        default_ttl: 300000 // 5 minutes of default caching
      },
      options
    );
  }

  /**
   * Logs an error message for debugging
   * @param {string} message
   */
  log(message) {
    if (this.options.debug === true) {
      console.log(message);
    }
  }

  /**
   * Gets the cache key for the given request id
   * @param {string} requestId
   * @return {string}
   */
  getCacheKey(requestId) {
    return this.options.cache_prefix + requestId;
  }

  /**
   * Check if the cachedResponse given exists an is still valid
   * @param {object} cachedResponse
   * @param {int} cachedResponse.cached_until
   * @param {object} cachedResponse.cached_data
   * @return {*}
   */
  isValidResponse(cachedResponse) {
    if (cachedResponse.cached_until < Date.now()) {
      this.log(`CACHE: response expired at '${cachedResponse.cached_until}'`);
      return false;
    }
    return true;
  }

  /**
   * Add a response to the cache storage
   * @param requestId
   * @param response
   */
  addResponse(requestId, response) {
    this.log(`CACHE: adding response '${requestId}'`);
    const cacheTTL = response.config.__cache_ttl || this.options.default_ttl;
    const responseData = {
      cached_until: cacheTTL == 0 ? undefined : Date.now() + cacheTTL,
      cached_data: JSON.parse(JSON.stringify(response.data))
    };
    localStorage.setItem(this.getCacheKey(requestId), JSON.stringify(responseData));
  }

  /**
   * Remove a response foron the cache storage
   * @param requestId
   */
  removeResponse(requestId) {
    this.log(`CACHE: removing response '${requestId}'`);
    localStorage.removeItem(this.getCacheKey(requestId));
  }

  /**
   * Get a response data object from the cache
   * @param requestId
   * @return {*}
   */
  getResponse(requestId) {
    this.log(`CACHE: check response existence '${requestId}'`);
    const cachedResponse = JSON.parse(localStorage.getItem(this.getCacheKey(requestId)));
    if (cachedResponse === null) {
      this.log(`CACHE: response doesn't exists '${requestId}'`);
      return null;
    }
    if (!this.isValidResponse(cachedResponse)) {
      this.log(`CACHE: response expired at '${cachedResponse.cached_until}'`);
      this.removeResponse(requestId);
      return null;
    }
    this.log(`CACHE: response found '${requestId}'`);
    this.log(`CACHE: response valid until '${cachedResponse.cached_until}'`);
    return cachedResponse.cached_data;
  }
  isCacheable(config) {
    return config.__cache_ttl > -1
  }
}
