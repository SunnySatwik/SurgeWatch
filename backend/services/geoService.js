const { fetchApi } = require('../utils/apiHelpers');
const cache = require('./cacheService');

const getAutoLocation = async (ip) => {
    try {
        const url = `https://freeipapi.com/api/json${ip && ip !== '::1' && ip !== '127.0.0.1' ? '/' + ip : ''}`;
        const raw = await fetchApi(url);
        if (!raw.latitude) throw new Error('No coordinates returned');
        
        return {
            city: raw.cityName || 'Unknown',
            state: raw.regionName,
            country: raw.countryCode,
            lat: raw.latitude,
            lon: raw.longitude
        };
    } catch (err) {
        // Fallback
        const fbUrl = `https://ipwho.is/${ip && ip !== '::1' && ip !== '127.0.0.1' ? ip : ''}`;
        const fb = await fetchApi(fbUrl);
        if (!fb.success) throw new Error('IP auto-locate failed');
        
        return {
            city: fb.city || 'Unknown',
            state: fb.region,
            country: fb.country_code,
            lat: fb.latitude,
            lon: fb.longitude
        };
    }
};

const searchCity = async (query) => {
    const cacheKey = cache.generateKey('searchCity', { query });
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const data = await fetchApi(url);
    
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found');
    }

    const exact = data.results.find(r => r.name.toLowerCase() === query.toLowerCase());
    const r = exact || data.results[0];

    const result = {
        city: r.name,
        state: r.admin1,
        country: r.country_code,
        lat: r.latitude,
        lon: r.longitude
    };

    cache.set(cacheKey, result);
    return result;
};

const reverseGeocode = async (lat, lon) => {
    const cacheKey = cache.generateKey('revGeocode', { lat, lon });
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Use Nominatim or BigDataCloud for reverse geocode
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const data = await fetchApi(url);

    const result = {
        city: data.city || data.locality || 'Unknown',
        state: data.principalSubdivision,
        country: data.countryCode,
        lat: parseFloat(lat),
        lon: parseFloat(lon)
    };

    cache.set(cacheKey, result);
    return result;
};

module.exports = { getAutoLocation, searchCity, reverseGeocode };
