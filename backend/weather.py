import time
import requests


# =========================================================
# VIGIL WEATHER CONFIGURATION
# =========================================================

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

# Keep weather in memory for 5 minutes.
# This prevents repeated requests for the same location.
CACHE_DURATION_SECONDS = 300

_weather_cache = {}


# =========================================================
# COMMON REQUEST SETTINGS
# =========================================================

HEADERS = {
    "User-Agent": "VIGIL-Environmental-Decision-Support-System/1.0"
}


# =========================================================
# LOCATION SEARCH
# =========================================================

def geocode_location(city):

    params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json"
    }

    response = requests.get(
        GEOCODING_URL,
        params=params,
        headers=HEADERS,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("results"):
        raise ValueError(
            f"Location '{city}' was not found."
        )

    location = data["results"][0]

    return {
        "name": location["name"],
        "country": location.get("country"),
        "latitude": location["latitude"],
        "longitude": location["longitude"]
    }


# =========================================================
# LIVE WEATHER
# =========================================================

def fetch_weather(latitude, longitude):

    # Create a cache key using rounded coordinates.
    cache_key = (
        round(float(latitude), 3),
        round(float(longitude), 3)
    )

    # -----------------------------------------------------
    # CHECK CACHE
    # -----------------------------------------------------

    cached = _weather_cache.get(cache_key)

    if cached:

        age = time.time() - cached["timestamp"]

        if age < CACHE_DURATION_SECONDS:

            print(
                f"Using cached weather data "
                f"(age: {int(age)} seconds)"
            )

            return cached["weather"]


    # -----------------------------------------------------
    # OPEN-METEO REQUEST
    # -----------------------------------------------------

    params = {

        "latitude": latitude,

        "longitude": longitude,

        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "wind_speed_10m,"
            "weather_code"
        ),

        "hourly": (
            "wind_speed_10m,"
            "precipitation"
        ),

        "forecast_days": 1,

        "timezone": "auto",

        "wind_speed_unit": "kmh",

        "precipitation_unit": "mm"
    }


    # -----------------------------------------------------
    # RETRY LOGIC
    # -----------------------------------------------------

    max_attempts = 3

    for attempt in range(max_attempts):

        try:

            response = requests.get(
                OPEN_METEO_URL,
                params=params,
                headers=HEADERS,
                timeout=15
            )

            # -------------------------------------------------
            # RATE LIMIT
            # -------------------------------------------------

            if response.status_code == 429:

                print(
                    f"Open-Meteo rate limit reached. "
                    f"Attempt {attempt + 1}/{max_attempts}"
                )

                if attempt < max_attempts - 1:

                    # Wait before trying again.
                    time.sleep(2 ** attempt)

                    continue

                response.raise_for_status()


            # -------------------------------------------------
            # OTHER HTTP ERRORS
            # -------------------------------------------------

            response.raise_for_status()

            data = response.json()

            # -------------------------------------------------
            # CURRENT WEATHER
            # -------------------------------------------------

            current = data["current"]

            hourly = data["hourly"]

            # -------------------------------------------------
            # NEXT 6 HOURS
            # -------------------------------------------------

            forecast_wind = hourly["wind_speed_10m"][:6]

            forecast_rain = hourly["precipitation"][:6]

            # Make sure arrays contain values.
            if not forecast_wind:

                forecast_wind = [current["wind_speed_10m"]]

            if not forecast_rain:

                forecast_rain = [current["precipitation"]]


            # -------------------------------------------------
            # WEATHER OBJECT
            # -------------------------------------------------

            weather = {

                "temperature_c":
                    current["temperature_2m"],

                "humidity_pct":
                    current["relative_humidity_2m"],

                "rainfall_mm":
                    current["precipitation"],

                "wind_speed_kmh":
                    current["wind_speed_10m"],

                "weather_code":
                    current["weather_code"],

                "forecast_wind_kmh":
                    max(forecast_wind),

                "forecast_rain_mm":
                    sum(forecast_rain),

                "forecast": {

                    "wind_kmh":
                        forecast_wind,

                    "rain_mm":
                        forecast_rain
                },

                "condition":
                    get_weather_condition(
                        current["weather_code"]
                    ),

                "source":
                    "LIVE"
            }


            # -------------------------------------------------
            # SAVE TO CACHE
            # -------------------------------------------------

            _weather_cache[cache_key] = {

                "timestamp": time.time(),

                "weather": weather
            }


            print(
                "Live weather successfully fetched "
                "from Open-Meteo."
            )

            return weather


        except requests.exceptions.RequestException as error:

            print(
                f"Open-Meteo request failed "
                f"(attempt {attempt + 1}/{max_attempts}): "
                f"{error}"
            )

            if attempt < max_attempts - 1:

                time.sleep(2 ** attempt)

                continue

            raise


# =========================================================
# WEATHER CONDITION
# =========================================================

def get_weather_condition(code):

    if code == 0:
        return "Clear sky"

    if code in [1, 2, 3]:
        return "Partly cloudy"

    if code in [45, 48]:
        return "Foggy"

    if code in [51, 53, 55]:
        return "Drizzle"

    if code in [61, 63, 65]:
        return "Rain"

    if code in [66, 67]:
        return "Freezing rain"

    if code in [71, 73, 75, 77]:
        return "Snow"

    if code in [80, 81, 82]:
        return "Rain showers"

    if code in [95, 96, 99]:
        return "Thunderstorm"

    return "Unknown"


# =========================================================
# FALLBACK WEATHER
# =========================================================

def mock_weather():

    return {

        "temperature_c": 27,

        "humidity_pct": 78,

        "rainfall_mm": 2.5,

        "wind_speed_kmh": 22,

        "weather_code": 61,

        "condition": "Rain",

        "forecast_wind_kmh": 30,

        "forecast_rain_mm": 6,

        "forecast": {

            "wind_kmh": [
                22,
                24,
                26,
                28,
                30,
                27
            ],

            "rain_mm": [
                1,
                1,
                1,
                2,
                1,
                1
            ]
        },

        "source": "DEMO / FALLBACK"
    }