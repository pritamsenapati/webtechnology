const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const weatherData = document.getElementById("weatherData");
const updatedAt = document.getElementById("updatedAt");
const cityChips = document.querySelectorAll(".city-chip");

const weatherConditions = {
    0: ["Clear sky", "☀️", "🌙"],
    1: ["Mainly clear", "🌤️", "🌙"],
    2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"],
    45: ["Fog", "🌫️", "🌫️"],
    48: ["Depositing rime fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"],
    53: ["Moderate drizzle", "🌦️", "🌧️"],
    55: ["Dense drizzle", "🌧️", "🌧️"],
    56: ["Light freezing drizzle", "🌧️", "🌧️"],
    57: ["Dense freezing drizzle", "🌧️", "🌧️"],
    61: ["Slight rain", "🌦️", "🌧️"],
    63: ["Moderate rain", "🌧️", "🌧️"],
    65: ["Heavy rain", "🌧️", "🌧️"],
    66: ["Light freezing rain", "🌧️", "🌧️"],
    67: ["Heavy freezing rain", "🌧️", "🌧️"],
    71: ["Slight snowfall", "🌨️", "🌨️"],
    73: ["Moderate snowfall", "🌨️", "🌨️"],
    75: ["Heavy snowfall", "❄️", "❄️"],
    77: ["Snow grains", "🌨️", "🌨️"],
    80: ["Slight rain showers", "🌦️", "🌧️"],
    81: ["Moderate rain showers", "🌧️", "🌧️"],
    82: ["Violent rain showers", "🌧️", "🌧️"],
    85: ["Slight snow showers", "🌨️", "🌨️"],
    86: ["Heavy snow showers", "❄️", "❄️"],
    95: ["Thunderstorm", "⛈️", "⛈️"],
    96: ["Thunderstorm with slight hail", "⛈️", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️", "⛈️"]
};

searchForm.addEventListener("submit", event => {
    event.preventDefault();
    getWeather(cityInput.value.trim());
});

cityChips.forEach(chip => {
    chip.addEventListener("click", () => {
        cityInput.value = chip.dataset.city;
        getWeather(chip.dataset.city);
    });
});

async function getWeather(city) {
    if (!city) {
        return;
    }

    setLoading(true);
    weatherData.innerHTML = `
        <div class="loading-state">
            <div class="spinner" aria-hidden="true"></div>
            <p>Reading the latest conditions...</p>
        </div>
    `;
    updatedAt.textContent = "Updating now";

    try {
        const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
        geocodingUrl.search = new URLSearchParams({
            name: city,
            count: "1",
            language: "en",
            format: "json"
        });

        const locationResponse = await fetch(geocodingUrl);
        if (!locationResponse.ok) {
            throw new Error("Could not search for that location. Please try again.");
        }

        const locationData = await locationResponse.json();
        const location = locationData.results?.[0];
        if (!location) {
            throw new Error("City not found. Check the spelling and try another location.");
        }

        const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
        weatherUrl.search = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure,visibility",
            hourly: "temperature_2m,weather_code,precipitation_probability",
            forecast_hours: "24",
            timezone: "auto"
        });

        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            throw new Error("Weather data is temporarily unavailable. Please try again.");
        }

        const weather = await weatherResponse.json();
        if (!weather.current) {
            throw new Error("Weather data is temporarily unavailable. Please try again.");
        }

        renderWeather(location, weather);
        updatedAt.textContent = `Updated ${formatLocalTime(weather.current.time)}`;
    } catch (error) {
        console.error("Weather error:", error);
        weatherData.innerHTML = `
            <div class="error-state">
                <span class="error-icon">!</span>
                <h2>${error.message === "City not found. Check the spelling and try another location." ? "City not found" : "Weather unavailable"}</h2>
                <p>${escapeHtml(error.message || "Check your internet connection and try again.")}</p>
            </div>
        `;
        updatedAt.textContent = "Could not update";
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    weatherData.setAttribute("aria-busy", String(isLoading));
    searchButton.disabled = isLoading;
    searchButton.querySelector("span:first-child").textContent = isLoading ? "Finding..." : "Search";
    cityChips.forEach(chip => {
        chip.disabled = isLoading;
    });
}

function renderWeather(location, weather) {
    const current = weather.current;
    const [description, dayIcon, nightIcon] = weatherConditions[current.weather_code] || ["Unknown conditions", "🌡️", "🌡️"];
    const icon = current.is_day ? dayIcon : nightIcon;
    const locationName = [location.name, location.country].filter(Boolean).join(", ");
    const hourlyForecast = getUpcomingHours(weather);
    const theme = getWeatherTheme(current.weather_code, current.is_day);

    weatherData.innerHTML = `
        <div class="weather-overview">
            <section class="weather-main" data-theme="${theme}" aria-label="Current conditions">
                <div class="location-row">
                    <div>
                        <p class="label">CURRENT CONDITIONS</p>
                        <h2>${escapeHtml(locationName)}</h2>
                    </div>
                    <p class="local-time">${escapeHtml(formatLocalTime(current.time))}</p>
                </div>
                <div class="temperature-row">
                    <span class="weather-icon" role="img" aria-label="${escapeHtml(description)}">${icon}</span>
                    <div>
                        <p class="temperature">${Math.round(current.temperature_2m)}<span>°C</span></p>
                        <p class="condition">${escapeHtml(description)}</p>
                        <p class="feels-like">Feels like ${Math.round(current.apparent_temperature)}°</p>
                    </div>
                </div>
            </section>
            <div class="metrics" aria-label="Weather details">
                <div class="metric">
                    <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2S6.5 9.5 6.5 14a5.5 5.5 0 0 0 11 0c0-4.5-5.5-10.8-5.5-10.8Z"/></svg></span>
                    <span>Humidity</span><strong>${current.relative_humidity_2m}%</strong>
                </div>
                <div class="metric">
                    <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 8h11a3 3 0 1 0-3-3M2 12h16a3 3 0 1 1-3 3M4 16h7a2.5 2.5 0 1 1-2.5 2.5"/></svg></span>
                    <span>Wind</span><strong>${Math.round(current.wind_speed_10m)} km/h</strong>
                </div>
                <div class="metric">
                    <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 12 16 8M8 16h8"/></svg></span>
                    <span>Pressure</span><strong>${Math.round(current.surface_pressure)} hPa</strong>
                </div>
                <div class="metric">
                    <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg></span>
                    <span>Visibility</span><strong>${(current.visibility / 1000).toFixed(1)} km</strong>
                </div>
            </div>
        </div>
        <section class="hourly-section" aria-labelledby="hourlyTitle">
            <div class="hourly-heading">
                <div>
                    <p class="eyebrow">PLAN AHEAD</p>
                    <h2 id="hourlyTitle">The next few hours</h2>
                </div>
                <span class="hourly-caption">HOURLY FORECAST</span>
            </div>
            <div class="hourly-grid">${hourlyForecast}</div>
        </section>
        </div>
    `;
}

function getWeatherTheme(code, isDay) {
    if ([95, 96, 99].includes(code)) return "storm";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
    if ([45, 48].includes(code)) return "fog";
    if (!isDay) return "night";
    if (code === 0 || code === 1) return "sunny";
    return "cloudy";
}

function getUpcomingHours(weather) {
    const hourly = weather.hourly;
    if (!hourly?.time?.length) {
        return "";
    }

    const upcoming = hourly.time
        .map((time, index) => ({ time, index }))
        .filter(({ time }) => time > weather.current.time)
        .slice(0, 6);

    return upcoming.map(({ time, index }, position) => {
        const code = hourly.weather_code[index];
        const [description, dayIcon] = weatherConditions[code] || ["Unknown conditions", "🌡️"];
        const label = position === 0 ? "Next" : formatHour(time);
        const rainChance = hourly.precipitation_probability?.[index];
        return `
            <article class="hour-item${position === 0 ? " is-next" : ""}">
                <p class="hour-label">${label}</p>
                <span class="hour-icon" role="img" aria-label="${escapeHtml(description)}">${dayIcon}</span>
                <p class="hour-temp">${Math.round(hourly.temperature_2m[index])}°</p>
                ${rainChance > 0 ? `<p class="rain-chance">💧 ${rainChance}%</p>` : '<p class="rain-chance">&nbsp;</p>'}
            </article>
        `;
    }).join("");
}

function formatHour(time) {
    const [hours] = time.split("T")[1].split(":");
    const hour = Number(hours);
    return `${hour % 12 || 12}${hour >= 12 ? "p" : "a"}`;
}

function formatLocalTime(time) {
    const [hours, minutes] = time.split("T")[1].split(":");
    const hour = Number(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

getWeather(cityInput.value.trim());
