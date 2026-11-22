const axios = require('axios');

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL[cite: 14]

async function getCoordinatesForCity(city) {
    const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: { name: city, count: 1 },
        timeout: 5000 // 5 seconds timeout[cite: 12]
    });

    const result = response.data.results && response.data.results[0];
    if (!result) {
        const err = new Error(`City "${city}" was not found`);
        err.status = 404;
        throw err;
    }
    return { latitude: result.latitude, longitude: result.longitude, resolvedName: result.name };
}

async function fetchExternalWeatherData(city) {
    const startTime = Date.now();
    const { latitude, longitude, resolvedName } = await getCoordinatesForCity(city);

    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: { latitude, longitude, current_weather: true },
        timeout: 5000 // Change to 1ms to test ECONNABORTED timeout handling
    });

    const duration = Date.now() - startTime;
    console.log(`External API call for "${city}" took ${duration}ms`); // Execution time logging[cite: 14]

    const current = response.data.current_weather;
    return {
        city: resolvedName,
        temperatureC: current.temperature,
        windSpeedKmh: current.windspeed,
        observedAt: current.time
    };
}

async function getCurrentWeather(city) {
    const cacheKey = city.trim().toLowerCase();
    const cached = cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
        console.log(`Cache hit for city: ${city}`); // Log cache hit[cite: 14]
        return cached.data;
    }

    let weatherData;
    try {
        weatherData = await fetchExternalWeatherData(city);
    } catch (error) {
        if (error.status === 404) throw error; // Do not retry 404 errors[cite: 14]
        console.log(`Retrying call for city: ${city}...`); // Single retry strategy[cite: 14]
        weatherData = await fetchExternalWeatherData(city);
    }

    cache.set(cacheKey, { data: weatherData, expiresAt: Date.now() + CACHE_TTL_MS });
    return weatherData;
}

module.exports = { getCurrentWeather };