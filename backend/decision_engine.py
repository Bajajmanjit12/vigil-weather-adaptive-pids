# backend/decision_engine.py


def calculate_risk(weather):
    """
    Calculate environmental risk from current
    and short-term forecast conditions.
    """

    risk = 0
    factors = []

    wind = weather["wind_speed_kmh"]
    rain = weather["rainfall_mm"]
    humidity = weather["humidity_pct"]

    forecast_wind = weather["forecast_wind_kmh"]
    forecast_rain = weather["forecast_rain_mm"]

    # -----------------------------
    # CURRENT WIND
    # -----------------------------

    if wind >= 40:
        risk += 25
        factors.append({
            "name": "High current wind",
            "value": f"{wind} km/h",
            "impact": 25
        })

    elif wind >= 25:
        risk += 15
        factors.append({
            "name": "Elevated current wind",
            "value": f"{wind} km/h",
            "impact": 15
        })

    elif wind >= 15:
        risk += 5
        factors.append({
            "name": "Moderate current wind",
            "value": f"{wind} km/h",
            "impact": 5
        })


    # -----------------------------
    # CURRENT RAIN
    # -----------------------------

    if rain >= 10:
        risk += 25
        factors.append({
            "name": "Heavy rainfall",
            "value": f"{rain} mm",
            "impact": 25
        })

    elif rain >= 5:
        risk += 15
        factors.append({
            "name": "Moderate rainfall",
            "value": f"{rain} mm",
            "impact": 15
        })

    elif rain > 0:
        risk += 5
        factors.append({
            "name": "Light rainfall",
            "value": f"{rain} mm",
            "impact": 5
        })


    # -----------------------------
    # HUMIDITY
    # -----------------------------

    if humidity >= 90:
        risk += 15
        factors.append({
            "name": "Very high humidity",
            "value": f"{humidity}%",
            "impact": 15
        })

    elif humidity >= 75:
        risk += 8
        factors.append({
            "name": "High humidity",
            "value": f"{humidity}%",
            "impact": 8
        })


    # -----------------------------
    # FORECAST WIND
    # -----------------------------

    if forecast_wind >= 40:
        risk += 15
        factors.append({
            "name": "Strong forecast wind",
            "value": f"{forecast_wind} km/h",
            "impact": 15
        })

    elif forecast_wind >= 25:
        risk += 8
        factors.append({
            "name": "Elevated forecast wind",
            "value": f"{forecast_wind} km/h",
            "impact": 8
        })


    # -----------------------------
    # FORECAST RAIN
    # -----------------------------

    if forecast_rain >= 10:
        risk += 10
        factors.append({
            "name": "Heavy forecast rainfall",
            "value": f"{forecast_rain} mm",
            "impact": 10
        })

    elif forecast_rain >= 5:
        risk += 5
        factors.append({
            "name": "Forecast rainfall",
            "value": f"{forecast_rain} mm",
            "impact": 5
        })


    # Keep score between 0 and 100
    risk = min(risk, 100)

    return risk, factors


def get_recommendation(risk):
    """
    Convert risk score into sensitivity level.
    """

    if risk >= 75:
        return "CRITICAL"

    if risk >= 50:
        return "HIGH"

    if risk >= 25:
        return "NORMAL"

    return "LOW"


def get_evidence(weather, risk, recommendation, factors):
    """
    Generate human-readable explanation
    from actual decision inputs.
    """

    if factors:

        factor_text = ", ".join(
            factor["name"].lower()
            for factor in factors
        )

        summary = (
            f"VIGIL recommends {recommendation} sensitivity "
            f"because of {factor_text}."
        )

    else:

        summary = (
            "Environmental conditions are currently stable. "
            "No major risk factors were detected."
        )

    return {
        "summary": summary,
        "risk": risk,
        "factors": factors
    }