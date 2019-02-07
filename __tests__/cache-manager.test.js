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
    test('isValidResponse returns correct value', () => {
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

        cachedResponse = { cached_until: NaN }
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
    test('isCacheable correctly determines cacheability based on cache_ttl', () => {
        expect(cacheManager).toBeDefined();
        let config = { __cache_ttl: -1 }
        let cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = { __cache_ttl: -100 }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = { __cache_ttl: -Infinity }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = { __cache_ttl: undefined }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = { __cache_ttl: null }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = { __cache_ttl: NaN }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = {}
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(false)

        config = { __cache_ttl: 0 }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(true)

        config = { __cache_ttl: 100 }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(true)

        config = { __cache_ttl: Infinity }
        cacheable = cacheManager.isCacheable(config);
        expect(cacheable).toBe(true)

    });
    describe('Cache related functions', () => {
        beforeAll(() => {
            class LocalStorageMock {
                constructor() {
                    this.store = {
                        "axios-cache-testReqID0": '{"cached_until": ' + (Date.now() + 31536000000) + ',"cached_data": {"someData": "testing get response!"}}',
                        "axios-cache-testReqID1": '{"cached_until": ' + (Date.now()) + ',"cached_data": {"someData": "testing get response!"}}'
                    };
                }

                clear() {
                    this.store = {};
                }

                getItem(key) {
                    return this.store[key] || null;
                }

                setItem(key, value) {
                    this.store[key] = value.toString();
                }

                removeItem(key) {
                    delete this.store[key];
                }
            };

            global.localStorage = new LocalStorageMock;
        });
        test('getResponse correctly gets test object', () => {
            expect(cacheManager).toBeDefined();
            let reqID = 'testReqID0';
            expect(cachedResponse).toBeFalsy()
            let cachedResponse = cacheManager.getResponse(reqID);
            expect(cachedResponse).toEqual({ 'someData': 'testing get response!' })

            reqID = 'testReqID1';
            //limitation of jest version, no spyOn capability
            // const spy = jest.spyOn(cacheManager, 'removeResponse');
            cachedResponse = cacheManager.getResponse(reqID);
            expect(cachedResponse).toBe(null);
            // expect(cacheManager.removeResponse).toHaveBeenCalledTimes(1)

            reqID = 'testReqID2';
            cachedResponse = cacheManager.getResponse(reqID);
            expect(cachedResponse).toBe(null);
        });
        test('addResponse correctly adds test object', () => {
            expect(cacheManager).toBeDefined();
            let reqID = 'testReqID';
            let response = {
                config: {
                    __cache_ttl: 450000
                },
                data: {
                    someData: 'test'
                }
            }
            expect(cachedResponse).toBeFalsy()
            cacheManager.addResponse(reqID, response);
            let cachedResponse = JSON.parse(localStorage.getItem('axios-cache-testReqID'));
            expect(cachedResponse.cached_data).toEqual({ someData: 'test' })

            response = {
                config: {
                    __cache_ttl: 0
                },
                data: {
                    someData: 'test'
                }
            }
            cacheManager.addResponse(reqID, response);
            cachedResponse = JSON.parse(localStorage.getItem('axios-cache-testReqID'));
            expect(cachedResponse.cached_until).toBeGreaterThan(Date.now())

            //31536000000 = 1 year
            const aYearFromNow = Date.now() + 31536000000;
            const aYearFromNowString = aYearFromNow.toString();
            const cachedUntilString = cachedResponse.cached_until.toString();

            expect(cachedResponse.cached_until).toBeLessThanOrEqual(aYearFromNow)

            //prediction within 10 milliseconds
            expect(cachedUntilString.startsWith(aYearFromNowString.substring(0, aYearFromNowString.length - 1))).toBe(true);
        });
        test('removeResponse correctly removes test object', () => {
            expect(cacheManager).toBeDefined();
            let reqID = 'testReqID';
            expect(cachedResponse).toBeFalsy()
            let cachedResponse = cacheManager.getResponse(reqID);
            expect(cachedResponse).toEqual({ 'someData': 'test' });
            cacheManager.removeResponse(reqID);
            expect(localStorage.getItem(cacheManager.getCacheKey(reqID))).toBe(null);
            cachedResponse = cacheManager.getResponse(reqID);
            expect(cachedResponse).toBe(null);
        });

    });
});