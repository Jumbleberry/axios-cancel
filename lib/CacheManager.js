export default class CacheManager {
  constructor(options) {
    this.options = Object.assign(
      {
        cache_prefix: 'axios-cache-',
        default_ttl: 300000 // 5 minutes of default caching
      },
      options
    );
  }

  log(message) {
    if (this.options.debug === true) {
      console.log(message);
    }
  }

  getCacheKey(requestId) {
    return this.options.cache_prefix + requestId;
  }

  hasResponse(requestId) {
    this.log(`CACHE: check response existence '${requestId}'`);
    return localStorage.getItem(this.getCacheKey(requestId)) !== null;
  }

  addResponse(requestId, response) {
    this.log(`CACHE: adding response '${requestId}'`);
    const cacheTTL = response.config.__cache_ttl || this.options.default_ttl;
    const responseData = {
      cached_until: Date.now() + cacheTTL,
      cached_data: JSON.parse(JSON.stringify(response.data))
    };
    localStorage.setItem(this.getCacheKey(requestId), JSON.stringify(responseData));
  }

  removeResponse(requestId) {
    this.log(`CACHE: removing response '${requestId}'`);
    localStorage.removeItem(this.getCacheKey(requestId));
  }

  getResponse(requestId) {
    if (this.hasResponse(requestId)) {
      this.log(`CACHE: response found '${requestId}'`);
      const cachedResponse = JSON.parse(localStorage.getItem(this.getCacheKey(requestId)));
      if (cachedResponse.cached_until >= Date.now()) {
        this.log(`CACHE: response valid until '${cachedResponse.cached_until}'`);
        return cachedResponse.cached_data;
      }
      this.log(`CACHE: response expired '${requestId}'`);
      this.removeResponse(requestId);
    }
    return null;
  }
}
