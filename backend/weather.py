import requests


def geocode_location(city):
    """
    Convert a city name into latitude and longitude.
    """

    url = "https://geocoding-api.open-meteo.com/v1/search"

    params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json"
    }

    response = requests.get(
        url,
        params=params,
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


def fetch_weather(latitude, longitude):
    """
    Fetch live weather and 6-hour forecast.
    """

    url = "https://api.open-meteo.com/v1/forecast"

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
        url,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    current = data["current"]
    hourly = data["hourly"]

    forecast_wind = hourly["wind_speed_10m"][:6]
    forecast_rain = hourly["precipitation"][:6]

    return {
        "temperature_c": current["temperature_2m"],
        "humidity_pct": current["relative_humidity_2m"],
        "rainfall_mm": current["precipitation"],
        "wind_speed_kmh": current["wind_speed_10m"],
        "weather_code": current["weather_code"],

        "forecast_wind_kmh": max(forecast_wind),
        "forecast_rain_mm": sum(forecast_rain),

        "forecast": {
            "wind_kmh": forecast_wind,
            "rain_mm": forecast_rain
        },

        "condition": get_weather_condition(
            current["weather_code"]
        ),

        "source": "LIVE"
    }


def get_weather_condition(code):
    """
    Convert Open-Meteo weather code into
    a human-readable condition.
    """

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


def mock_weather():
    """
    Demo fallback data.

    This is used only when live weather
    cannot be obtained.
    """

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
            "wind_kmh": [22, 24, 26, 28, 30, 27],
            "rain_mm": [1, 1, 1, 2, 1, 1]
        },

        "source": "DEMO / FALLBACK"
    }