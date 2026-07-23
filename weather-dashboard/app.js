        // =========================================================================
        // CONFIGURATION
        // =========================================================================
        // Using Open-Meteo API which is completely FREE and requires NO API KEY!
        const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
        const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
        // =========================================================================
        
        // DOM Elements
        const cityInput = document.getElementById('cityInput');
        const locationBtn = document.getElementById('locationBtn');
        const unitToggle = document.getElementById('unitToggle');
        const weatherInfo = document.getElementById('weatherInfo');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const errorMsg = document.getElementById('errorMsg');
        const suggestionsList = document.getElementById('suggestionsList');
        
        // State
        let currentUnit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
        let lastQuery = null; // Store last query to easily refetch on unit toggle

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            let cachedCity = null;
            try {
                cachedCity = localStorage.getItem('lastSearchedCity');
            } catch (e) {
                console.warn('localStorage is not available:', e);
            }
            
            if (cachedCity) {
                fetchWeather(cachedCity);
            } else {
                fetchWeather('London');
            }
        });

        // Event Listeners
        cityInput.addEventListener('input', debounce(async (e) => {
            const city = e.target.value.trim();
            if (city.length > 2) {
                await fetchSuggestions(city);
            } else {
                suggestionsList.classList.remove('active');
            }
        }, 400));

        cityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    suggestionsList.classList.remove('active');
                    fetchWeather(query);
                }
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                suggestionsList.classList.remove('active');
            }
        });

        async function fetchSuggestions(query) {
            try {
                const res = await fetch(`${GEO_API_URL}?name=${encodeURIComponent(query)}&count=5`);
                if (!res.ok) return;
                const data = await res.json();
                
                if (data.results && data.results.length > 0) {
                    showSuggestions(data.results);
                } else {
                    showFallbackSuggestions(query);
                }
            } catch (err) {
                console.error(err);
            }
        }

        function showSuggestions(results) {
            suggestionsList.innerHTML = '';
            results.forEach(loc => {
                const li = document.createElement('li');
                li.className = 'suggestion-item';
                
                const locationText = loc.admin1 ? `${loc.name}, ${loc.admin1}, ${loc.country}` : `${loc.name}, ${loc.country}`;
                
                li.innerHTML = `<i class="fa-solid fa-location-dot suggestion-icon"></i> <span>${locationText}</span>`;
                li.addEventListener('click', () => {
                    cityInput.value = loc.name;
                    suggestionsList.classList.remove('active');
                    fetchWeatherByCoords(loc.latitude, loc.longitude, true, loc.name, loc.country);
                });
                suggestionsList.appendChild(li);
            });
            suggestionsList.classList.add('active');
        }

        function showFallbackSuggestions(query) {
            suggestionsList.innerHTML = `
                <li style="padding: 12px 20px; color: #888; font-style: italic;">No exact match for "${query}"</li>
                <li class="suggestion-item" onclick="fetchPopularCity('London', 'United Kingdom')"><i class="fa-solid fa-city suggestion-icon"></i> London, United Kingdom</li>
                <li class="suggestion-item" onclick="fetchPopularCity('New York', 'United States')"><i class="fa-solid fa-city suggestion-icon"></i> New York, United States</li>
                <li class="suggestion-item" onclick="fetchPopularCity('Tokyo', 'Japan')"><i class="fa-solid fa-city suggestion-icon"></i> Tokyo, Japan</li>
            `;
            suggestionsList.classList.add('active');
        }

        window.fetchPopularCity = function(city, country) {
            cityInput.value = city;
            suggestionsList.classList.remove('active');
            fetchWeather(city);
        };

        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                showLoading();
                
                const options = {
                    enableHighAccuracy: false, // False makes it much faster (weather only needs city-level accuracy)
                    timeout: 8000,             // Time out after 8 seconds instead of hanging forever
                    maximumAge: 300000         // Accept cached locations up to 5 minutes old for instant results
                };

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        fetchWeatherByCoords(lat, lon, false, "Current Location", "");
                    },
                    (error) => {
                        console.warn(`Geolocation Error (${error.code}): ${error.message}`);
                        showError("Location access denied or timed out. Please type your city in the search bar.");
                    },
                    options
                );
            } else {
                showError("Geolocation is not supported by this browser.");
            }
        });

        unitToggle.addEventListener('click', () => {
            currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
            unitToggle.textContent = currentUnit === 'metric' ? '°C' : '°F';
            
            // Refetch with new unit
            if (lastQuery) {
                if (lastQuery.type === 'city') {
                    fetchWeather(lastQuery.val, false);
                } else if (lastQuery.type === 'coords') {
                    fetchWeatherByCoords(lastQuery.lat, lastQuery.lon, false, lastQuery.cityName, lastQuery.countryName);
                }
            }
        });

        // Utility: Debounce
        function debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }

        // Fetch by City Name
        async function fetchWeather(city, cache = true) {
            showLoading();
            lastQuery = { type: 'city', val: city };
            suggestionsList.classList.remove('active');

            try {
                // 1. Geocode the city to get lat/lon
                const geoRes = await fetch(`${GEO_API_URL}?name=${encodeURIComponent(city)}&count=1`);
                if (!geoRes.ok) throw new Error('Network error');
                const geoData = await geoRes.json();
                
                if (!geoData.results || geoData.results.length === 0) {
                    throw new Error(`City "${city}" not found.`);
                }
                
                const location = geoData.results[0];
                
                // 2. Fetch weather using lat/lon
                await fetchWeatherByCoords(location.latitude, location.longitude, cache, location.name, location.country);
            } catch (err) {
                showError(err.message);
                showFallbackSuggestions(city);
            }
        }

        // Fetch by Coordinates
        async function fetchWeatherByCoords(lat, lon, cache = true, cityName = "Unknown", countryName = "") {
            showLoading();
            lastQuery = { type: 'coords', lat, lon, cityName, countryName };

            try {
                // Reverse geocode if city is generic (from GPS button)
                let isGps = false;
                if (cityName === "Current Location" || cityName === "Unknown") {
                    isGps = true;
                    try {
                        // Use Nominatim (OpenStreetMap) to get highly specific district-level data, forcing English language
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
                        if (geoRes.ok) {
                            const geoData = await geoRes.json();
                            const addr = geoData.address || {};
                            
                            // Explicitly prioritize district, county, or city
                            cityName = addr.state_district || addr.county || addr.city || addr.town || addr.village || "Nearby Location";
                            countryName = addr.country || "";
                        } else {
                            cityName = "Nearby Location";
                        }
                    } catch (e) {
                        console.warn("Reverse geocoding failed", e);
                        cityName = "Nearby Location";
                    }
                }

                const currentUnitTemp = currentUnit === 'metric' ? 'celsius' : 'fahrenheit';
                const currentUnitWind = currentUnit === 'metric' ? 'ms' : 'mph';
                
                const url = `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&temperature_unit=${currentUnitTemp}&wind_speed_unit=${currentUnitWind}`;
                
                const weatherRes = await fetch(url);
                if (!weatherRes.ok) throw new Error('Weather data not found');
                const weatherData = await weatherRes.json();

                if (cache && cityName !== "Nearby Location" && cityName !== "Unknown") {
                    try {
                        localStorage.setItem('lastSearchedCity', cityName);
                    } catch (e) {
                        console.warn('localStorage is not available:', e);
                    }
                }
                
                // Update the search bar with the discovered location name if from GPS
                if (isGps) {
                    cityInput.value = cityName;
                }
                
                updateUI(weatherData, cityName, countryName);
            } catch (err) {
                showError("Could not fetch data for this location.");
            }
        }

        // Map WMO codes to OpenWeatherMap icon codes and conditions
        function getWeatherInfo(code, isDay = 1) {
            const codes = {
                0: { desc: 'Clear sky', icon: isDay ? '01d' : '01n', condition: 'clear' },
                1: { desc: 'Mainly clear', icon: isDay ? '02d' : '02n', condition: 'clouds' },
                2: { desc: 'Partly cloudy', icon: isDay ? '03d' : '03n', condition: 'clouds' },
                3: { desc: 'Overcast', icon: isDay ? '04d' : '04n', condition: 'clouds' },
                45: { desc: 'Fog', icon: '50d', condition: 'fog' },
                48: { desc: 'Depositing rime fog', icon: '50d', condition: 'fog' },
                51: { desc: 'Light drizzle', icon: '09d', condition: 'drizzle' },
                53: { desc: 'Moderate drizzle', icon: '09d', condition: 'drizzle' },
                55: { desc: 'Dense drizzle', icon: '09d', condition: 'drizzle' },
                56: { desc: 'Light freezing drizzle', icon: '09d', condition: 'drizzle' },
                57: { desc: 'Dense freezing drizzle', icon: '09d', condition: 'drizzle' },
                61: { desc: 'Slight rain', icon: '10d', condition: 'rain' },
                63: { desc: 'Moderate rain', icon: '10d', condition: 'rain' },
                65: { desc: 'Heavy rain', icon: '10d', condition: 'rain' },
                66: { desc: 'Light freezing rain', icon: '13d', condition: 'rain' },
                67: { desc: 'Heavy freezing rain', icon: '13d', condition: 'rain' },
                71: { desc: 'Slight snow fall', icon: '13d', condition: 'snow' },
                73: { desc: 'Moderate snow fall', icon: '13d', condition: 'snow' },
                75: { desc: 'Heavy snow fall', icon: '13d', condition: 'snow' },
                77: { desc: 'Snow grains', icon: '13d', condition: 'snow' },
                80: { desc: 'Slight rain showers', icon: '09d', condition: 'rain' },
                81: { desc: 'Moderate rain showers', icon: '09d', condition: 'rain' },
                82: { desc: 'Violent rain showers', icon: '09d', condition: 'rain' },
                85: { desc: 'Slight snow showers', icon: '13d', condition: 'snow' },
                86: { desc: 'Heavy snow showers', icon: '13d', condition: 'snow' },
                95: { desc: 'Thunderstorm', icon: '11d', condition: 'thunderstorm' },
                96: { desc: 'Thunderstorm with slight hail', icon: '11d', condition: 'thunderstorm' },
                99: { desc: 'Thunderstorm with heavy hail', icon: '11d', condition: 'thunderstorm' },
            };
            return codes[code] || { desc: 'Unknown', icon: '01d', condition: 'clear' };
        }

        // UI Updates
        function updateUI(data, cityName, countryName) {
            hideLoading();
            
            const current = data.current;
            const daily = data.daily;
            
            const weatherInfoData = getWeatherInfo(current.weather_code, current.is_day);
            
            document.getElementById('cityName').textContent = countryName ? `${cityName}, ${countryName}` : cityName;
            document.getElementById('currentDate').textContent = formatDate(new Date());
            
            document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m);
            document.getElementById('tempUnit').textContent = currentUnit === 'metric' ? '°C' : '°F';
            
            document.getElementById('weatherDesc').textContent = weatherInfoData.desc;
            
            document.getElementById('feelsLike').textContent = Math.round(current.apparent_temperature);
            document.getElementById('humidity').textContent = current.relative_humidity_2m;
            
            document.getElementById('windSpeed').textContent = current.wind_speed_10m.toFixed(1);
            document.getElementById('speedUnit').textContent = currentUnit === 'metric' ? 'm/s' : 'mph';

            document.getElementById('pressure').textContent = Math.round(current.pressure_msl);


            document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${weatherInfoData.icon}@4x.png`;

            updateBackground(weatherInfoData.condition);

            updateForecastUI(daily);
            
            weatherInfo.classList.add('active');
        }

        function updateForecastUI(daily) {
            const container = document.getElementById('forecastContainer');
            container.innerHTML = '';

            // Get next 5 days (skipping index 0 which is today)
            for(let i = 1; i <= 5 && i < daily.time.length; i++) {
                const dateObj = new Date(daily.time[i]);
                const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj);
                const weatherInfoData = getWeatherInfo(daily.weather_code[i]);
                
                const html = `
                    <div class="forecast-item">
                        <div class="forecast-day">${dayName}</div>
                        <img class="forecast-icon" src="https://openweathermap.org/img/wn/${weatherInfoData.icon}.png" alt="Icon">
                        <div class="forecast-temps">
                            <span class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                            <span class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
                        </div>
                    </div>
                `;
                container.innerHTML += html;
            }
        }

        function updateBackground(condition) {
            // Remove previous weather classes
            document.body.className = '';
            
            // Map conditions to classes
            const weatherClasses = {
                'clear': 'weather-clear',
                'clouds': 'weather-clouds',
                'rain': 'weather-rain',
                'drizzle': 'weather-drizzle',
                'thunderstorm': 'weather-thunderstorm',
                'snow': 'weather-snow',
                'mist': 'weather-mist',
                'fog': 'weather-fog'
            };

            const bgClass = weatherClasses[condition] || 'weather-clear';
            document.body.classList.add(bgClass);
        }

        // Helpers
        function showLoading() {
            weatherInfo.classList.remove('active');
            errorState.classList.remove('active');
            loadingState.classList.add('active');
        }

        function hideLoading() {
            loadingState.classList.remove('active');
        }

        function showError(msg) {
            hideLoading();
            weatherInfo.classList.remove('active');
            errorMsg.textContent = msg;
            errorState.classList.add('active');
            // reset background to default
            document.body.className = '';
        }

        function formatDate(date) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
