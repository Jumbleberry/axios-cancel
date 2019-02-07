import CacheManager from '../lib/CacheManager';

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        cacheManager = new CacheManager();
    });

    test('Constructed with defaults', () => {
        expect(cacheManager.options).toBeDefined();
        expect(cacheManager.options.cache_prefix).toBe('axios-cache-');
        expect(cacheManager.options.default_ttl).toBe(300000);
    });
    test('Constructed with custom Options', () => {
        cacheManager = new CacheManager({ debug: true, default_ttl: 450000 })
        expect(cacheManager.options).toBeDefined();
        expect(cacheManager.options.debug).toBe(true);
        expect(cacheManager.options.default_ttl).toBe(450000);
    });
    test('getCacheKey returns correct test request key', () => {
        expect(cacheManager).toBeDefined();
        let cacheKey = cacheManager.getCacheKey('testID');
        expect(cacheKey).toBe('axios-cache-testID');
    });
    test('isValidReponse returns correct value', () => {
        expect(cacheManager).toBeDefined();

        let cachedResponse = { cached_until: 0 }
        let validResponse = cacheManager.isValidResponse(cachedResponse);
        expect(validResponse).toBe(false);

        cachedResponse = { cached_until: null }
        validResponse = cacheManager.isValidResponse(cachedResponse);
        expect(validResponse).toBe(false);

        cachedResponse = { cached_until: undefined }
        validResponse = cacheManager.isValidResponse(cachedResponse);
        expect(validResponse).toBe(false);

        cachedResponse = {}
        validResponse = cacheManager.isValidResponse(cachedResponse);
        expect(validResponse).toBe(false);

        cachedResponse = { cached_until: Date.now() + 100 }
        validResponse = cacheManager.isValidResponse(cachedResponse);
        expect(validResponse).toBe(true);

        cachedResponse = { cached_until: Infinity }
        validResponse = cacheManager.isValidResponse(cachedResponse);
        expect(validResponse).toBe(true);
    });


});