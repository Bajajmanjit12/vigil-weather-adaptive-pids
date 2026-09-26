import os
import time
import requests


# =========================================================
# VIGIL WEATHER CONFIGURATION
# =========================================================

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

WEATHERAPI_URL = "https://api.weatherapi.com/v1/forecast.json"

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

CACHE_DURATION_SECONDS = 300

_weather_cache = {}

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
# MAIN WEATHER FUNCTION
# =========================================================

def fetch_weather(latitude, longitude):

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
                f"Using cached live weather "
                f"(age: {int(age)} seconds)"
            )

            return cached["weather"]


    # -----------------------------------------------------
    # TRY OPEN-METEO FIRST
    # -----------------------------------------------------

    try:

        weather = fetch_open_meteo(
            latitude,
            longitude
        )

        save_weather_cache(
            cache_key,
            weather
        )

        return weather

    except Exception as error:

        print(
            "Open-Meteo unavailable:",
            error
        )

        print(
            "Trying WeatherAPI backup..."
        )


    # -----------------------------------------------------
    # TRY WEATHERAPI BACKUP
    # -----------------------------------------------------

    try:

        weather = fetch_weatherapi(
            latitude,
            longitude
        )

        save_weather_cache(
            cache_key,
            weather
        )

        return weather

    except Exception as error:

        print(
            "WeatherAPI unavailable:",
            error
        )


    # -----------------------------------------------------
    # USE PREVIOUS LIVE DATA IF AVAILABLE
    # -----------------------------------------------------

    cached = _weather_cache.get(cache_key)

    if cached:

        print(
            "Using previously cached live weather."
        )

        weather = dict(cached["weather"])

        weather["source"] = "LIVE / CACHED"

        return weather


    # -----------------------------------------------------
    # EVERYTHING FAILED
    # -----------------------------------------------------

    print(
        "No live weather source available."
    )

    raise Exception(
        "All live weather providers are unavailable."
    )


# =========================================================
# OPEN-METEO
# =========================================================

def fetch_open_meteo(latitude, longitude):

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

    response = requests.get(
        OPEN_METEO_URL,
        params=params,
        headers=HEADERS,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    current = data["current"]

    hourly = data["hourly"]

    forecast_wind = hourly[
        "wind_speed_10m"
    ][:6]

    forecast_rain = hourly[
        "precipitation"
    ][:6]

    if not forecast_wind:
        forecast_wind = [
            current["wind_speed_10m"]
        ]

    if not forecast_rain:
        forecast_rain = [
            current["precipitation"]
        ]

    return {

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
            "LIVE - Open-Meteo"
    }


# =========================================================
# WEATHERAPI BACKUP
# =========================================================

def fetch_weatherapi(latitude, longitude):

    api_key = os.getenv(
        "WEATHERAPI_KEY"
    )

    if not api_key:

        raise Exception(
            "WEATHERAPI_KEY environment variable is missing."
        )

    params = {

        "key": api_key,

        "q": f"{latitude},{longitude}",

        "days": 1,

        "aqi": "no",

        "alerts": "no"
    }

    response = requests.get(
        WEATHERAPI_URL,
        params=params,
        headers=HEADERS,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    # -----------------------------------------------------
    # CHECK API ERROR RESPONSE
    # -----------------------------------------------------

    if "error" in data:

        raise Exception(
            data["error"].get(
                "message",
                "WeatherAPI returned an error."
            )
        )

    current = data["current"]

    forecast_days = data[
        "forecast"
    ]["forecastday"]

    hourly = forecast_days[0]["hour"]

    # -----------------------------------------------------
    # FIND CURRENT + NEXT 5 HOURS
    # -----------------------------------------------------

    current_epoch = current[
        "last_updated_epoch"
    ]

    future_hours = []

    for hour in hourly:

        if hour["time_epoch"] >= current_epoch:

            future_hours.append(hour)

        if len(future_hours) >= 6:

            break

    # Fallback if API does not return enough hours
    if not future_hours:

        future_hours = hourly[:6]

    forecast_wind = [
        hour["wind_kph"]
        for hour in future_hours
    ]

    forecast_rain = [
        hour["precip_mm"]
        for hour in future_hours
    ]

    # -----------------------------------------------------
    # WEATHER CODE
    # -----------------------------------------------------

    weather_code = get_weatherapi_code(
        current["condition"]["text"]
    )

    return {

        "temperature_c":
            current["temp_c"],

        "humidity_pct":
            current["humidity"],

        "rainfall_mm":
            current["precip_mm"],

        "wind_speed_kmh":
            current["wind_kph"],

        "weather_code":
            weather_code,

        "forecast_wind_kmh":
            max(forecast_wind)
            if forecast_wind
            else current["wind_kph"],

        "forecast_rain_mm":
            sum(forecast_rain)
            if forecast_rain
            else current["precip_mm"],

        "forecast": {

            "wind_kmh":
                forecast_wind,

            "rain_mm":
                forecast_rain
        },

        "condition":
            current["condition"]["text"],

        "source":
            "LIVE - WeatherAPI"
    }


# =========================================================
# SAVE CACHE
# =========================================================

def save_weather_cache(
    cache_key,
    weather
):

    _weather_cache[cache_key] = {

        "timestamp":
            time.time(),

        "weather":
            weather
    }

    print(
        f"Weather cached from {weather['source']}."
    )


# =========================================================
# OPEN-METEO WEATHER CONDITIONS
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
# WEATHERAPI CONDITION → INTERNAL CODE
# =========================================================

def get_weatherapi_code(condition):

    text = condition.lower()

    if "thunder" in text:
        return 95

    if "snow" in text:
        return 71

    if "rain" in text:
        return 63

    if "drizzle" in text:
        return 53

    if "fog" in text or "mist" in text:
        return 45

    if "cloud" in text:
        return 2

    if "overcast" in text:
        return 3

    if "clear" in text or "sunny" in text:
        return 0

    return 3


# =========================================================
# DEMO FALLBACK
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

        "source":
            "DEMO / FALLBACK"
    }