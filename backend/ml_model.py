# backend/ml_model.py


def predict_ml(weather):
    """
    Demonstrative ML decision-support model.

    This is intentionally simple for the hackathon prototype.
    It uses the same environmental features that VIGIL
    is designed to monitor.
    """

    wind = weather["wind_speed_kmh"]
    rain = weather["rainfall_mm"]
    humidity = weather["humidity_pct"]
    forecast_wind = weather["forecast_wind_kmh"]
    forecast_rain = weather["forecast_rain_mm"]

    # -----------------------------
    # Feature-based ML score
    # -----------------------------

    score = 0

    # Wind
    if wind >= 40:
        score += 25
    elif wind >= 25:
        score += 15
    elif wind >= 15:
        score += 5

    # Rain
    if rain >= 10:
        score += 25
    elif rain >= 5:
        score += 15
    elif rain > 0:
        score += 5

    # Humidity
    if humidity >= 90:
        score += 15
    elif humidity >= 75:
        score += 8

    # Forecast wind
    if forecast_wind >= 40:
        score += 15
    elif forecast_wind >= 25:
        score += 8

    # Forecast rain
    if forecast_rain >= 10:
        score += 10
    elif forecast_rain >= 5:
        score += 5

    score = min(score, 100)

    # -----------------------------
    # ML recommendation
    # -----------------------------

    if score >= 75:
        recommendation = "CRITICAL"

    elif score >= 50:
        recommendation = "HIGH"

    elif score >= 25:
        recommendation = "NORMAL"

    else:
        recommendation = "LOW"

    # -----------------------------
    # Demonstrative confidence
    # -----------------------------

    if score >= 75:
        confidence = 92

    elif score >= 50:
        confidence = 88

    elif score >= 25:
        confidence = 82

    else:
        confidence = 86

    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "score": score,
        "model_type": "Demonstrative ML"
    }