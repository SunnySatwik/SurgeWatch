const { fetchApi } = require('../utils/apiHelpers');
const cache = require('./cacheService');

const getWeather = async (lat, lon) => {
    const cacheKey = cache.generateKey('weather', { lat, lon });
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code` +
        `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code` +
        `&timezone=auto&forecast_days=1`;

    const rawData = await fetchApi(url);
    
    // Normalize data for frontend
    const normalized = {
        current: rawData.current,
        hourly: rawData.hourly,
        updatedAt: new Date().toISOString()
    };

    cache.set(cacheKey, normalized);
    return normalized;
};

module.exports = { getWeather };
