// Initialize the map
const map = L.map("map").setView([20, 77], 5); // Default view: Center of India

// Define light and dark tile layers
const lightTileLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }
);

const darkTileLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }
);

// Add the light tile layer to the map by default
lightTileLayer.addTo(map);

// Function to get weather emoji based on weather description
function getWeatherEmoji(weatherDescription) {
  const weatherEmojis = {
    clear: "☀️",
    clouds: "☁️",
    rain: "🌧️",
    thunderstorm: "⚡",
    snow: "❄️",
    mist: "🌫️",
    fog: "🌫️",
  };

  if (weatherDescription.includes("clear")) return weatherEmojis.clear;
  if (weatherDescription.includes("cloud")) return weatherEmojis.clouds;
  if (weatherDescription.includes("rain")) return weatherEmojis.rain;
  if (weatherDescription.includes("thunderstorm")) return weatherEmojis.thunderstorm;
  if (weatherDescription.includes("snow")) return weatherEmojis.snow;
  if (weatherDescription.includes("mist") || weatherDescription.includes("fog")) return weatherEmojis.mist;
  return "🌍";
}

// Fetch current weather data
async function fetchWeather(lat, lon) {
  const apiKey = "cadd09cea720b0cee953d8ae35fc9edd"; 
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Fetch 5-day weather forecast
async function fetchForecast(lat, lon) {
  const apiKey = "cadd09cea720b0cee953d8ae35fc9edd"; 
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching forecast data:", error);
  }
}


// Add search functionality
document.getElementById("search-btn").addEventListener("click", async function () {
  const searchQuery = document.getElementById("place").value;

  if (searchQuery) {
    const apiKey = "cadd09cea720b0cee953d8ae35fc9edd"; 
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${searchQuery}&limit=1&appid=${apiKey}`;

    try {
      const response = await fetch(geocodingUrl);
      const geocodingData = await response.json();

      if (geocodingData.length > 0) {
        const { lat, lon, name, country } = geocodingData[0];

        // Center the map on the searched location
        map.setView([lat, lon], 10);

        // Fetch weather data for the searched location
        const weatherData = await fetchWeather(lat, lon);

        // Fetch 5-day forecast for the searched location
        const forecastData = await fetchForecast(lat, lon);

        if (weatherData && forecastData) {
          const weatherEmoji = getWeatherEmoji(weatherData.weather[0].description);

          // Add marker with location and weather emoji in the popup
          L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>Location:</b> ${name}, ${country} ${weatherEmoji}`)
            .openPopup();

         
          // Group data by distinct days
const groupedByDay = forecastData.list.reduce((acc, entry) => {
  const date = new Date(entry.dt * 1000).toLocaleDateString(); // Extract only the date
  if (!acc[date]) {
    acc[date] = [];
  }
  acc[date].push(entry);
  return acc;
}, {});

// Extract one representative forecast for each day (e.g., the one closest to midday)
const forecastDetails = Object.keys(groupedByDay)
  .slice(0, 5) // Take data for the next 5 distinct days
  .map((date) => {
    const dayEntries = groupedByDay[date];

    // Find the forecast closest to midday (12:00 PM)
    const middayForecast = dayEntries.reduce((closest, entry) => {
      const entryTime = new Date(entry.dt * 1000).getHours();
      return Math.abs(entryTime - 12) < Math.abs(new Date(closest.dt * 1000).getHours() - 12)
        ? entry
        : closest;
    });

    const temp = middayForecast.main.temp;
    const desc = middayForecast.weather[0].description;
    const emoji = getWeatherEmoji(desc);
    return `<b>${date}:</b> ${temp}°C, ${desc} ${emoji}`;
  })
  .join("<br>");

          // Update the info box with both current weather and forecast
          const weatherInfo = `
            <b>Location:</b> ${name}, ${country} ${weatherEmoji}<br>
            <b>Temperature:</b> ${weatherData.main.temp}°C<br>
            <b>Weather:</b> ${weatherData.weather[0].description}<br>
            <b>Humidity:</b> ${weatherData.main.humidity}%<br>
            <b>Wind Speed:</b> ${weatherData.wind.speed} m/s<br>
            <b>Pressure:</b> ${weatherData.main.pressure} hPa<br>
            <b>Sunrise:</b> ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}<br>
            <b>Sunset:</b> ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}<br>
            <hr>
            <b>5-Day Forecast (around midday):</b><br>${forecastDetails}
          `;
          document.getElementById("info").innerHTML = weatherInfo;
        }
      } else {
        alert("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching geocoding or weather data:", error);
      alert("An error occurred while searching for the location. Please try again.");
    }
  } else {
    alert("Please enter a place name to search.");
  }
});

// Handle map clicks to show weather
map.on("click", async function (e) {
  const { lat, lng } = e.latlng;

  // Fetch current weather and forecast data
  const weatherData = await fetchWeather(lat, lng);
  const forecastData = await fetchForecast(lat, lng);

  if (weatherData && forecastData) {
    const weatherEmoji = getWeatherEmoji(weatherData.weather[0].description);

    // Add marker with location and weather emoji in the popup
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<b>Location:</b> ${weatherData.name || "Unknown"} ${weatherEmoji}`)
      .openPopup();

    // Group data by distinct days
const groupedByDay = forecastData.list.reduce((acc, entry) => {
  const date = new Date(entry.dt * 1000).toLocaleDateString(); // Extract only the date
  if (!acc[date]) {
    acc[date] = [];
  }
  acc[date].push(entry);
  return acc;
}, {});

// Extract one representative forecast for each day (e.g., the one closest to midday)
const forecastDetails = Object.keys(groupedByDay)
  .slice(0, 5) // Take data for the next 5 distinct days
  .map((date) => {
    const dayEntries = groupedByDay[date];

    // Find the forecast closest to midday (12:00 PM)
    const middayForecast = dayEntries.reduce((closest, entry) => {
      const entryTime = new Date(entry.dt * 1000).getHours();
      return Math.abs(entryTime - 12) < Math.abs(new Date(closest.dt * 1000).getHours() - 12)
        ? entry
        : closest;
    });

    const temp = middayForecast.main.temp;
    const desc = middayForecast.weather[0].description;
    const emoji = getWeatherEmoji(desc);
    return `<b>${date}:</b> ${temp}°C, ${desc} ${emoji}`;
  })
  .join("<br>");


    // Update the info box
    const weatherInfo = `
      <b>Location:</b> ${weatherData.name || "Unknown"} ${weatherEmoji}<br>
      <b>Temperature:</b> ${weatherData.main.temp}°C<br>
      <b>Weather:</b> ${weatherData.weather[0].description}<br>
      <b>Humidity:</b> ${weatherData.main.humidity}%<br>
      <b>Wind Speed:</b> ${weatherData.wind.speed} m/s<br>
      <b>Pressure:</b> ${weatherData.main.pressure} hPa<br>
      <b>Sunrise:</b> ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}<br>
      <b>Sunset:</b> ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}<br>
      <hr>
      <b>5-Day Forecast (around midday):</b><br>${forecastDetails}
    `;

    document.getElementById("info").innerHTML = weatherInfo;
  }
});

// Light/Dark mode toggle functionality
const themeToggle = document.getElementById("theme-toggle");
const toggleLabel = document.getElementById("toggle-label");

themeToggle.addEventListener("change", function () {
  if (themeToggle.checked) {
    // Switch to Dark Mode
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
    document.querySelector("nav").classList.remove("light-mode");
    document.querySelector("nav").classList.add("dark-mode");
    document.querySelector(".theme-toggle").classList.remove("light-mode");
    document.querySelector(".theme-toggle").classList.add("dark-mode");
   
    document.querySelector("#search").classList.add("dark-mode");
  document.querySelector("#search input").classList.add("dark-mode");
  document.querySelector("#search button").classList.add("dark-mode");


  document.querySelector("#search").classList.add("dark-mode");
  document.querySelector("#info").classList.add("dark-mode");
    // Change tile layer to dark
    map.removeLayer(lightTileLayer);
    darkTileLayer.addTo(map);

    toggleLabel.textContent = "Dark Mode";
  } else {
    // Switch to Light Mode
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
    document.querySelector("nav").classList.remove("dark-mode");
    document.querySelector("nav").classList.add("light-mode");
    document.querySelector(".theme-toggle").classList.remove("dark-mode");
    document.querySelector(".theme-toggle").classList.add("light-mode");


    document.querySelector("#search").classList.remove("dark-mode");
  document.querySelector("#search input").classList.remove("dark-mode");
  document.querySelector("#search button").classList.remove("dark-mode");


  document.querySelector("#search").classList.remove("dark-mode");
  document.querySelector("#info").classList.remove("dark-mode");
    // Change tile layer to light
    map.removeLayer(darkTileLayer);
    lightTileLayer.addTo(map);

    toggleLabel.textContent = "Light Mode";
  }
});


