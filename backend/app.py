from flask import Flask, jsonify, request
from flask_cors import CORS
from ml_model import predict_ml
from weather import (
    geocode_location,
    fetch_weather,
    mock_weather
)

from decision_engine import (
    calculate_risk,
    get_recommendation,
    get_evidence
)
from database import (
    init_database,
    save_decision,
    get_all_history,
    delete_history,
    clear_all_history
)



# ==========================================
# FLASK APPLICATION
# ==========================================

app = Flask(__name__)

CORS(app)

# ==========================================
# INITIALIZE DATABASE
# ==========================================

init_database()
# ==========================================
# CURRENT ACTIVE SENSITIVITY
# ==========================================

active_sensitivity = "NORMAL"

# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "service": "VIGIL backend"
    })


# ==========================================
# RECOMMENDATION
# ==========================================

@app.route("/api/recommend", methods=["GET"])
def recommend():

    city = request.args.get("city")

    if not city:

        return jsonify({
            "error": "City is required."
        }), 400


    try:

        # ----------------------------------
        # Geocode location
        # ----------------------------------

        location = geocode_location(city)


        # ----------------------------------
        # Fetch weather
        # ----------------------------------

        try:

            weather = fetch_weather(
                location["latitude"],
                location["longitude"]
            )

        except Exception as weather_error:

            print(
                "Live weather unavailable:",
                weather_error
            )

            weather = mock_weather()


        # ----------------------------------
        # Decision engine
        # ----------------------------------

        risk, factors = calculate_risk(weather)

        recommendation = get_recommendation(
            risk
        )
        ml_result = predict_ml(weather)

        evidence = get_evidence(
            weather,
            risk,
            recommendation,
            factors
        )


        # ----------------------------------
        # Response
        # ----------------------------------

        decision = {
            "location": location["name"],
            "risk": risk,
            "recommendation": recommendation,
            "active_sensitivity": active_sensitivity,
            "weather_source": weather["source"],
            "wind": weather["wind_speed_kmh"],
            "rain": weather["rainfall_mm"],
            "humidity": weather["humidity_pct"],
            "timestamp": __import__("datetime").datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        }

        decision_id = save_decision(decision)

        decision["id"] = decision_id
        return jsonify({
            "location": location,
            "weather": weather,
            "risk": risk,
            "recommendation": recommendation,
            "active_sensitivity": active_sensitivity,
            "evidence": evidence,
            "ml": ml_result
        })


    except ValueError as error:

        return jsonify({
            "error": str(error)
        }), 404


    except Exception as error:

        print(
            "VIGIL backend error:",
            error
        )

        return jsonify({
            "error": "Unable to process request."
        }), 500


# ==========================================
# APPLY RECOMMENDATION
# ==========================================

@app.route(
    "/api/apply-recommendation",
    methods=["POST"]
)
def apply_recommendation():

    global active_sensitivity

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "error": "Request body is required."
        }), 400


    sensitivity = data.get(
        "sensitivity"
    )


    allowed_levels = [
        "LOW",
        "NORMAL",
        "HIGH",
        "CRITICAL"
    ]


    if sensitivity not in allowed_levels:

        return jsonify({
            "error": "Invalid sensitivity level."
        }), 400


    active_sensitivity = sensitivity


    return jsonify({

        "status": "success",

        "active_sensitivity":
            active_sensitivity,

        "message":
            f"Perimeter sensitivity updated to {active_sensitivity}."

    })


# ==========================================
# PERIMETER ZONES
# ==========================================

@app.route("/api/zones", methods=["GET"])
def get_zones():

    # Simulated operational zones
    # for the MVP.

    zones = [

        {
            "id": "ZONE-A",
            "name": "North Perimeter",
            "risk": 72,
            "status": "Elevated",
            "recommendation": "HIGH",
            "active": active_sensitivity,
            "confidence": 88
        },

        {
            "id": "ZONE-B",
            "name": "East Perimeter",
            "risk": 54,
            "status": "Watch",
            "recommendation": "HIGH",
            "active": active_sensitivity,
            "confidence": 82
        },

        {
            "id": "ZONE-C",
            "name": "South Perimeter",
            "risk": 31,
            "status": "Moderate",
            "recommendation": "NORMAL",
            "active": active_sensitivity,
            "confidence": 76
        },

        {
            "id": "ZONE-D",
            "name": "West Perimeter",
            "risk": 18,
            "status": "Stable",
            "recommendation": "LOW",
            "active": active_sensitivity,
            "confidence": 91
        }

    ]


    return jsonify({
        "zones": zones
    })

@app.route("/api/history", methods=["GET"])
def get_history():

    history = get_all_history()

    return jsonify({
        "history": history
    })

@app.route(
    "/api/history/<int:history_id>",
    methods=["DELETE"]
)
def delete_history_record(history_id):

    deleted = delete_history(history_id)

    if not deleted:

        return jsonify({
            "error": "History record not found."
        }), 404

    return jsonify({
        "status": "success",
        "message": "History record deleted."
    })

# ==========================================
# CLEAR ALL HISTORY
# ==========================================

@app.route(
    "/api/history",
    methods=["DELETE"]
)
def clear_history():

    deleted_count = clear_all_history()

    return jsonify({
        "status": "success",
        "message": "All decision history has been cleared.",
        "deleted_count": deleted_count
    })

# ==========================================
# ROI SIMULATION
# ==========================================

@app.route("/api/simulate", methods=["GET"])
def simulate():

    # DEMO VALUES ONLY:
    # These are illustrative simulation values,
    # not measured results from real VIGIL operations.

    sample_size = 1000

    static_policy_alarms = 250

    dynamic_policy_alarms = 150

    if static_policy_alarms > 0:

        reduction = (
            (static_policy_alarms - dynamic_policy_alarms)
            / static_policy_alarms
        ) * 100

    else:
        reduction = 0

    return jsonify({
        "sample_size": sample_size,
        "static_policy_alarms": static_policy_alarms,
        "dynamic_policy_alarms": dynamic_policy_alarms,
        "estimated_false_alarm_reduction_pct": round(
            reduction, 1
        ),
        "data_source": "illustrative_demo"
    })
# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    print("Starting VIGIL backend...")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )