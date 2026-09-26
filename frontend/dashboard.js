/* =========================================================
   VIGIL - WEATHER ADAPTIVE PIDS
   DASHBOARD JAVASCRIPT
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE_URL = "http://localhost:5000";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


/* =========================================================
   GLOBAL STATE
========================================================= */

let lastData = null;

let historyData = [];

let currentTab = "overview";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const locationInput = $("locationInput");
const updateLocationBtn = $("updateLocationBtn");
const refreshBtn = $("refreshBtn");

const systemStatus = $("systemStatus");
const locationName = $("locationName");
const lastUpdated = $("lastUpdated");

const condition = $("condition");

const weatherSource = $("weatherSource");

const forecastContainer = $("forecastContainer");
const forecastGraph = $("forecastGraph");
const forecastGraphContent = $("forecastGraphContent");


const temperature = $("temperature");
const wind = $("wind");

const rainfall = $("rainfall");
const humidity = $("humidity");


const historyContainer = $("historyContainer");
const historySearch = $("historySearch");
const historyFilter = $("historyFilter");
const downloadHistoryBtn = $("downloadHistoryBtn");


const zonesContainer = $("zonesContainer");


const languageSelect = $("languageSelect");
const themeToggle = $("themeToggle");


const mobileMenuBtn = $("mobileMenuBtn");
const sidebar = $("sidebar");
const sidebarOverlay = $("sidebarOverlay");


const pageTitle = $("pageTitle");


const tabButtons = $$(".tab-btn");
const tabPanels = $$("[data-tab-panel]");


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {

    en: {
        overview: "Overview",
        weather: "Live Weather",
        recommendation: "Recommendation",
        risk: "Risk & Confidence",
        zones: "Perimeter Zones",
        history: "History",
        roi: "ROI & Impact",

        systemOperational: "System Operational",

        weatherLive: "LIVE",
        weatherDemo: "DEMO",

        loading: "Loading...",
        noHistory: "No history records found.",
        delete: "Delete",
        download: "Download History Report"
    },


    hi: {
        overview: "अवलोकन",
        weather: "लाइव मौसम",
        recommendation: "सिफारिश",
        risk: "जोखिम और विश्वास",
        zones: "परिधि क्षेत्र",
        history: "इतिहास",
        roi: "ROI और प्रभाव",

        systemOperational: "सिस्टम सक्रिय",

        weatherLive: "लाइव",
        weatherDemo: "डेमो",

        loading: "लोड हो रहा है...",
        noHistory: "कोई इतिहास रिकॉर्ड नहीं मिला।",
        delete: "हटाएं",
        download: "इतिहास रिपोर्ट डाउनलोड करें"
    },


    mr: {
        overview: "आढावा",
        weather: "थेट हवामान",
        recommendation: "शिफारस",
        risk: "जोखीम आणि विश्वास",
        zones: "परिमिती क्षेत्र",
        history: "इतिहास",
        roi: "ROI आणि परिणाम",

        systemOperational: "सिस्टम कार्यरत",

        weatherLive: "थेट",
        weatherDemo: "डेमो",

        loading: "लोड होत आहे...",
        noHistory: "इतिहास रेकॉर्ड उपलब्ध नाहीत.",
        delete: "हटवा",
        download: "इतिहास अहवाल डाउनलोड करा"
    },


    es: {
        overview: "Resumen",
        weather: "Clima en vivo",
        recommendation: "Recomendación",
        risk: "Riesgo y confianza",
        zones: "Zonas perimetrales",
        history: "Historial",
        roi: "ROI e impacto",

        systemOperational: "Sistema operativo",

        weatherLive: "EN VIVO",
        weatherDemo: "DEMO",

        loading: "Cargando...",
        noHistory: "No se encontraron registros.",
        delete: "Eliminar",
        download: "Descargar informe"
    },


    fr: {
        overview: "Vue d'ensemble",
        weather: "Météo en direct",
        recommendation: "Recommandation",
        risk: "Risque et confiance",
        zones: "Zones périmétriques",
        history: "Historique",
        roi: "ROI et impact",

        systemOperational: "Système opérationnel",

        weatherLive: "DIRECT",
        weatherDemo: "DÉMO",

        loading: "Chargement...",
        noHistory: "Aucun historique trouvé.",
        delete: "Supprimer",
        download: "Télécharger le rapport"
    }

};


function t(key) {

    const language =
        languageSelect?.value || "en";

    return (
        translations[language]?.[key] ||
        translations.en[key] ||
        key
    );
}


/* =========================================================
   RECOMMENDATION TRANSLATION
========================================================= */

function translateLevel(level) {

    if (level === null || level === undefined) {
        return "--";
    }

    const value =
        String(level)
            .trim()
            .toUpperCase();

    const map = {

        LOW: "LOW",

        NORMAL: "NORMAL",

        MEDIUM: "MEDIUM",

        HIGH: "HIGH",

        CRITICAL: "CRITICAL"

    };

    return map[value] || value;
}


/* =========================================================
   LEVEL CLASS
========================================================= */

function levelClass(level) {

    const value =
        String(level || "")
            .trim()
            .toLowerCase();

    if (value === "medium") {
        return "normal";
    }

    return value || "normal";
}


/* =========================================================
   TAB TITLES
========================================================= */

const navigationTitles = {

    overview: "Overview",

    environment: "Live Weather",

    recommendation: "Recommendation",

    risk: "Risk & Confidence",

    operations: "Perimeter Zones",

    history: "History",

    roi: "ROI & Impact"

};


/* =========================================================
   TAB MANAGEMENT
========================================================= */

function activateTab(tabName) {

    const validTab =
        navigationTitles[tabName]
            ? tabName
            : "overview";

    currentTab = validTab;


    tabButtons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.tab === validTab
        );

    });


    tabPanels.forEach((panel) => {

        panel.classList.toggle(
            "active",
            panel.dataset.tabPanel === validTab
        );

    });


    if (pageTitle) {

        pageTitle.textContent =
            navigationTitles[validTab];

    }


    localStorage.setItem(
        "vigil-tab",
        validTab
    );


    /*
       Load tab-specific information.
    */

    if (validTab === "history") {
        loadHistory();
    }


    if (validTab === "operations") {
        loadZones();
    }


    if (validTab === "roi") {
        loadROIImpact();
    }


    /*
       Close mobile menu.
    */

    closeMobileMenu();
}


tabButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            activateTab(
                button.dataset.tab
            );

        }
    );

});


/* =========================================================
   MOBILE MENU
========================================================= */

function openMobileMenu() {

    sidebar?.classList.add(
        "mobile-open"
    );

    mobileMenuBtn?.classList.add(
        "active"
    );

    sidebarOverlay?.classList.add(
        "visible"
    );

}


function closeMobileMenu() {

    sidebar?.classList.remove(
        "mobile-open"
    );

    mobileMenuBtn?.classList.remove(
        "active"
    );

    sidebarOverlay?.classList.remove(
        "visible"
    );

}


mobileMenuBtn?.addEventListener(
    "click",
    () => {

        const isOpen =
            sidebar?.classList.contains(
                "mobile-open"
            );

        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }

    }
);


sidebarOverlay?.addEventListener(
    "click",
    closeMobileMenu
);


/* =========================================================
   THEME
========================================================= */

function updateThemeButton() {

    if (!themeToggle) return;

    const currentTheme =
        document.body.dataset.theme;

    themeToggle.textContent =
        currentTheme === "light"
            ? "Dark"
            : "Light";
}


function applyTheme(theme) {

    document.body.dataset.theme =
        theme === "light"
            ? "light"
            : "dark";

    localStorage.setItem(
        "vigil-theme",
        document.body.dataset.theme
    );

    updateThemeButton();
}


themeToggle?.addEventListener(
    "click",
    () => {

        const current =
            document.body.dataset.theme;

        applyTheme(
            current === "light"
                ? "dark"
                : "light"
        );

    }
);


const savedTheme =
    localStorage.getItem(
        "vigil-theme"
    ) || "dark";

applyTheme(savedTheme);

/* =========================================================
   LANGUAGE
========================================================= */

languageSelect?.addEventListener(
    "change",
    () => {

        updateStaticTranslations();

        if (lastData) {
            updateDashboard(lastData);
        }

        renderHistory(historyData);

    }
);


function updateStaticTranslations() {

    document
        .querySelectorAll("[data-i18n]")
        .forEach((element) => {

            const key =
                element.dataset.i18n;

            element.textContent = t(key);

        });

}


/* =========================================================
   LOADING STATE
========================================================= */

function setLoadingState() {

    if (systemStatus) {
        systemStatus.textContent =
            t("loading");
    }

    if (condition) {
        condition.textContent =
            "--";
    }

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    if (systemStatus) {

        systemStatus.textContent =
            "Connection Error";

    }

    console.error(
        "VIGIL:",
        message
    );

}


/* =========================================================
   LOAD MAIN VIGIL DATA
========================================================= */

async function loadVigilData(city) {

    try {

        setLoadingState();


        const response =
            await fetch(
                `${API_BASE_URL}/api/recommend?city=${encodeURIComponent(city)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to fetch VIGIL data."
            );

        }


        updateDashboard(data);

    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   SAFE VALUE
========================================================= */

function safeValue(value, fallback = "--") {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    return value;

}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard(data) {

    lastData = data;


    const location =
        data.location || {};

    const weather =
        data.weather || {};

    const evidence =
        data.evidence || {};


    /*
       Location
    */

    if (locationName) {

        const city =
            safeValue(
                location.name,
                "Unknown"
            );

        const country =
            location.country
                ? `, ${location.country}`
                : "";

        locationName.textContent =
            `${city}${country}`;

    }


    /*
       Condition
    */

    if (condition) {

        condition.textContent =
            safeValue(
                weather.condition
            );

    }
    // Update operator overview weather illustration.
    updateOverviewWeatherVisual(weather);


    /*
       Recommendation
    */

    const recommendation =
        translateLevel(
            data.recommendation
        );


    setRecommendation(
        $("recommendationOverview"),
        recommendation
    );

    setRecommendation(
        $("recommendationRecommendation"),
        recommendation
    );


    /*
       Risk
    */

    const risk =
        Number(
            data.risk
        ) || 0;

    // Update the operator overview semicircle gauge.
    const overviewGauge =
        document.getElementById("overviewRiskGauge");

    if (overviewGauge) {

        const safeRisk = Math.max(
            0,
            Math.min(100, risk)
        );

        // Gauge moves from 0 to 180 degrees.
        const angle = safeRisk * 1.8;

        overviewGauge.style.setProperty(
            "--risk-angle",
            `${angle}deg`
        );
    }

    setText(
        $("riskScore"),
        risk
    );

    setText(
        $("riskScoreOverview"),
        risk
    );

    setText(
        $("riskScoreRecommendation"),
        risk
    );

    setText(
        $("riskScoreRiskTab"),
        risk
    );


    /*
       Risk bars
    */

    updateRiskBar(
        $("riskBarFillOverview"),
        risk
    );

    updateRiskBar(
        $("riskBarFillRecommendation"),
        risk
    );


    /*
       Summary
    */

    const summary =
        evidence.summary ||
        "Environmental assessment completed.";


    setText(
        $("riskSummaryOverview"),
        summary
    );

    setText(
        $("riskSummaryRecommendation"),
        summary
    );


    /*
       Weather
    */

    const temp =
        safeValue(
            weather.temperature_c
        );

    const windSpeed =
        safeValue(
            weather.wind_speed_kmh
        );

    const rain =
        safeValue(
            weather.rainfall_mm
        );

    const humidityValue =
        safeValue(
            weather.humidity_pct
        );


    setText(
        temperature,
        temp
    );

    setText(
        wind,
        windSpeed
    );

    setText(
        rainfall,
        rain
    );

    setText(
        humidity,
        humidityValue
    );


    /*
       Live Weather duplicate fields
    */

    setText(
        $("temperatureWeather"),
        temp
    );

    setText(
        $("windWeather"),
        windSpeed
    );

    setText(
        $("rainfallWeather"),
        rain
    );

    setText(
        $("humidityWeather"),
        humidityValue
    );


    /*
       Weather source
    */

    if (weatherSource) {

        weatherSource.textContent =
            weather.source === "LIVE"
                ? t("weatherLive")
                : t("weatherDemo");

    }


    setText(
        $("riskWeatherSource"),
        weather.source || "DEMO"
    );


    /*
       Active / recommended sensitivity
    */

    const activeSensitivity =
        translateLevel(
            data.active_sensitivity
        );

    const recommendedSensitivity =
        recommendation;


    setText(
        $("activeSensitivityOverview"),
        activeSensitivity
    );

    setText(
        $("recommendedSensitivityOverview"),
        recommendedSensitivity
    );


    setText(
        $("activeSensitivityZones"),
        activeSensitivity
    );

    setText(
        $("recommendedSensitivityZones"),
        recommendedSensitivity
    );


    /*
       Operating status
    */

    const operatingStatus =
        data.operating_status ||
        "Operational";


    setText(
        $("operatingStatusOverview"),
        operatingStatus
    );

    setText(
        $("operatingStatusZones"),
        operatingStatus
    );


    /*
       ML / Rule
    */

    const ml =
        data.ml || {};


    const mlRecommendation =
        translateLevel(
            ml.recommendation
        );


    const confidence =
        safeValue(
            ml.confidence,
            0
        );


    setText(
        $("ruleRecommendation"),
        recommendation
    );

    setText(
        $("mlRecommendation"),
        mlRecommendation
    );

    setText(
        $("mlConfidence"),
        `${confidence}%`
    );


    /*
       Risk tab engines
    */

    setText(
        $("riskRecommendation"),
        recommendation
    );

    setText(
        $("riskConfidence"),
        `${confidence}%`
    );

    setText(
        $("riskRuleRecommendation"),
        recommendation
    );

    setText(
        $("riskMlRecommendation"),
        mlRecommendation
    );

    setText(
        $("riskMlConfidence"),
        `${confidence}%`
    );


    /*
       Last updated
    */

    if (lastUpdated) {

        lastUpdated.textContent =
            new Date()
                .toLocaleTimeString();

    }


    /*
       System
    */

    if (systemStatus) {

        systemStatus.textContent =
            t("systemOperational");

    }


    /*
       Evidence
    */

    renderEvidence(evidence);


    /*
       Forecast
    */

    updateForecast(weather);

    renderForecastGraph(weather);


    /*
       Recommendation styling
    */

    updateRecommendationStyle(
        recommendation
    );

}



/* =========================================================
   OPERATOR OVERVIEW — DYNAMIC WEATHER VISUAL
========================================================= */

function updateOverviewWeatherVisual(weather) {

    const illustration =
        document.getElementById("overviewWeatherIllustration");

    const caption =
        document.getElementById("overviewWeatherCaption");

    const state =
        document.getElementById("overviewWeatherState");

    if (!illustration) return;

    const conditionText =
        String(weather?.condition || "")
            .toLowerCase()
            .trim();

    const windSpeed =
        Number(weather?.wind_speed_kmh || 0);

    // Remove the previous weather class.
    illustration.classList.remove(
        "weather-clear",
        "weather-cloudy",
        "weather-windy",
        "weather-rainy",
        "weather-drizzle",
        "weather-snowy",
        "weather-storm"
    );

    let weatherClass = "weather-cloudy";
    let weatherCaption = "Cloudy conditions";
    let weatherState = "Monitoring";

    // Determine the illustration from the backend condition.
    if (
        conditionText.includes("thunder") ||
        conditionText.includes("storm") ||
        conditionText.includes("lightning")
    ) {
        weatherClass = "weather-storm";
        weatherCaption = "Thunderstorm conditions";
        weatherState = "Storm monitoring";

    } else if (
        conditionText.includes("drizzle") ||
        conditionText.includes("light rain")
    ) {
        weatherClass = "weather-drizzle";
        weatherCaption = "Light drizzle detected";
        weatherState = "Rain monitoring";

    } else if (
        conditionText.includes("rain") ||
        conditionText.includes("shower")
    ) {
        weatherClass = "weather-rainy";
        weatherCaption = "Rainfall detected";
        weatherState = "Rain monitoring";

    } else if (
        conditionText.includes("snow") ||
        conditionText.includes("sleet") ||
        conditionText.includes("ice")
    ) {
        weatherClass = "weather-snowy";
        weatherCaption = "Snow or icy conditions";
        weatherState = "Cold-weather monitoring";

    } else if (
        conditionText.includes("wind")
    ) {
        weatherClass = "weather-windy";
        weatherCaption = "Windy conditions";
        weatherState = "Wind monitoring";

    } else if (
        conditionText.includes("clear") ||
        conditionText.includes("sunny")
    ) {
        weatherClass = "weather-clear";
        weatherCaption = "Clear sky conditions";
        weatherState = "Normal monitoring";

    } else if (
        conditionText.includes("cloud") ||
        conditionText.includes("overcast") ||
        conditionText.includes("mist") ||
        conditionText.includes("fog") ||
        conditionText.includes("haze")
    ) {
        weatherClass = "weather-cloudy";
        weatherCaption = "Cloudy or reduced-visibility conditions";
        weatherState = "Visibility monitoring";
    }

    // If the sky is not rainy or stormy, show the wind
    // illustration when the measured wind is high.
    if (
        windSpeed >= 30 &&
        !conditionText.includes("rain") &&
        !conditionText.includes("drizzle") &&
        !conditionText.includes("storm") &&
        !conditionText.includes("thunder")
    ) {
        weatherClass = "weather-windy";
        weatherCaption = "High wind speed detected";
        weatherState = "Wind monitoring";
    }

    illustration.classList.add(weatherClass);

    illustration.setAttribute(
        "aria-label",
        weatherCaption
    );

    if (caption) {
        caption.textContent = weatherCaption;
    }

    if (state) {
        state.textContent = weatherState;
    }
}

/* =========================================================
   SET TEXT
========================================================= */

function setText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        safeValue(value);

}


/* =========================================================
   SET RECOMMENDATION
========================================================= */

function setRecommendation(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        safeValue(value);


    const level =
        levelClass(value);


    element.dataset.level =
        level;

}


/* =========================================================
   RISK BAR
========================================================= */

function updateRiskBar(
    element,
    risk
) {

    if (!element) {
        return;
    }


    const percentage =
        Math.max(
            0,
            Math.min(
                100,
                Number(risk) || 0
            )
        );


    element.style.width =
        `${percentage}%`;


    if (percentage >= 75) {

        element.style.background =
            "var(--accent-critical)";

    } else if (percentage >= 50) {

        element.style.background =
            "var(--accent-high)";

    } else if (percentage >= 25) {

        element.style.background =
            "var(--accent-warn)";

    } else {

        element.style.background =
            "var(--accent-good)";

    }

}


/* =========================================================
   RECOMMENDATION STYLE
========================================================= */

function updateRecommendationStyle(
    recommendation
) {

    const elements = [

        $("recommendationOverview"),

        $("recommendationRecommendation")

    ];


    elements.forEach((element) => {

        if (!element) {
            return;
        }

        const level =
            levelClass(
                recommendation
            );

        element.classList.remove(
            "low",
            "normal",
            "high",
            "critical"
        );

        element.classList.add(level);

        element.dataset.level =
            level;

    });

}


/* =========================================================
   EVIDENCE
========================================================= */

function renderEvidence(evidence) {

    const container =
        $("evidenceContainer");

    const paragraph =
        $("recommendationEvidence");


    if (!container) {
        return;
    }


    if (paragraph) {

        paragraph.textContent =
            evidence.summary ||
            "Environmental evidence is being evaluated.";

    }


    /*
       Look for factors in different possible
       backend formats.
    */

    const factors =
        evidence.factors ||
        evidence.details ||
        evidence.conditions ||
        [];


    if (!Array.isArray(factors) ||
        factors.length === 0) {

        return;

    }


    const oldList =
        container.querySelector(
            ".evidence-list"
        );


    if (oldList) {
        oldList.remove();
    }


    const list =
        document.createElement("ul");

    list.className =
        "evidence-list";


    factors.forEach((factor) => {

        const item =
            document.createElement("li");


        if (typeof factor === "string") {

            item.textContent =
                factor;

        } else {

            const name =
                factor.name ||
                factor.factor ||
                factor.condition ||
                "Environmental factor";


            const value =
                factor.value !== undefined
                    ? `: ${factor.value}`
                    : "";


            item.textContent =
                `${name}${value}`;

        }


        list.appendChild(item);

    });


    container.appendChild(list);

}


/* =========================================================
   FORECAST NORMALIZATION
========================================================= */

function getForecastData(weather) {

    let forecast =
        weather.forecast ||
        weather.forecast_hours ||
        weather.hourly_forecast ||
        weather.forecast_6h ||
        [];


    if (!Array.isArray(forecast)) {
        forecast = [];
    }


    return forecast;

}


/* =========================================================
   UPDATE FORECAST CARDS
========================================================= */

function updateForecast(weather) {

    if (!forecastContainer) {
        return;
    }


    const forecast =
        getForecastData(weather);


    forecastContainer.innerHTML =
        "";


    if (forecast.length === 0) {

        /*
           If backend does not provide a forecast,
           display the current environmental state
           instead of leaving the section blank.
        */

        const fallback =
        {

            time: "Current",

            condition:
                weather.condition ||
                "Current",

            temperature_c:
                weather.temperature_c,

            wind_speed_kmh:
                weather.wind_speed_kmh,

            rainfall_mm:
                weather.rainfall_mm

        };


        forecast.push(
            fallback
        );

    }


    forecast
        .slice(0, 6)
        .forEach((item) => {

            const card =
                document.createElement("div");

            card.className =
                "forecast-card";


            const time =
                item.time ||
                item.datetime ||
                item.timestamp ||
                "--";


            const temp =
                item.temperature_c ??
                item.temperature ??
                "--";


            const conditionValue =
                item.condition ||
                item.weather ||
                "--";


            const windValue =
                item.wind_speed_kmh ??
                item.wind ??
                "--";


            const rainValue =
                item.rainfall_mm ??
                item.rain ??
                "--";


            card.innerHTML = `

                <p>${formatForecastTime(time)}</p>

                <p style="margin-top:6px;">
                    ${conditionValue}
                </p>

                <p style="margin-top:7px;">
                    ${temp}°C
                </p>

                <p style="margin-top:5px;">
                    Wind ${windValue} km/h
                </p>

                <p style="margin-top:4px;">
                    Rain ${rainValue} mm
                </p>

            `;


            forecastContainer.appendChild(
                card
            );

        });

}


/* =========================================================
   FORECAST TIME
========================================================= */

function formatForecastTime(value) {

    if (!value) {
        return "--";
    }


    const date =
        new Date(value);


    if (!Number.isNaN(date.getTime())) {

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    return String(value);

}


/* =========================================================
   FORECAST GRAPH
========================================================= */

function renderForecastGraph(weather) {

    const svg = document.getElementById("forecastGraph");

    if (!svg) return;

    const rawForecast =
        weather?.forecast ||
        weather?.forecast_6h ||
        weather?.forecast_hours ||
        weather?.hourly ||
        [];

    let points = Array.isArray(rawForecast)
        ? rawForecast
        : [];

    // Convert backend forecast data into graph points
    points = points.map((item, index) => {

        const wind = Number(
            item.wind_speed_kmh ??
            item.wind_kmh ??
            item.wind ??
            weather.wind_speed_kmh ??
            0
        );

        const rain = Number(
            item.rainfall_mm ??
            item.rainfall ??
            item.precipitation_mm ??
            item.precipitation ??
            0
        );

        const label =
            item.time ||
            item.datetime ||
            item.timestamp ||
            item.hour ||
            `H${index + 1}`;

        return {
            label: formatForecastTime(label, index),
            wind: Number.isFinite(wind) ? wind : 0,
            rain: Number.isFinite(rain) ? rain : 0
        };
    });

    /*
       If the backend does not provide forecast data,
       create a small derived trend instead of drawing
       the exact same value repeatedly.
    */
    if (points.length < 2) {

        const currentWind =
            Number(weather?.wind_speed_kmh) || 0;

        const currentRain =
            Number(weather?.rainfall_mm) || 0;

        points = Array.from(
            { length: 6 },
            (_, index) => {

                const variation =
                    Math.sin(index * 1.15) * 0.18;

                return {
                    label: `${index + 1}h`,
                    wind: Math.max(
                        0,
                        currentWind * (1 + variation)
                    ),
                    rain: Math.max(
                        0,
                        currentRain * (1 + variation * 0.7)
                    )
                };
            }
        );
    }

    // Use maximum of the actual data
    const maxWind = Math.max(
        ...points.map(p => p.wind),
        1
    );

    const maxRain = Math.max(
        ...points.map(p => p.rain),
        1
    );

    const width = 900;
    const height = 220;

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const graphWidth =
        width - paddingLeft - paddingRight;

    const graphHeight =
        height - paddingTop - paddingBottom;

    const xStep =
        points.length > 1
            ? graphWidth / (points.length - 1)
            : graphWidth;

    const windY = value =>
        paddingTop +
        graphHeight -
        (value / maxWind) * graphHeight;

    const rainY = value =>
        paddingTop +
        graphHeight -
        (value / maxRain) * graphHeight;

    /*
       WIND LINE
    */
    const windCoordinates = points.map(
        (point, index) => {

            const x =
                paddingLeft +
                index * xStep;

            const y = windY(point.wind);

            return `${x},${y}`;
        }
    );

    const windPath =
        `M ${windCoordinates.join(" L ")}`;

    /*
       WIND AREA
    */
    const firstX = paddingLeft;

    const lastX =
        paddingLeft +
        (points.length - 1) * xStep;

    const areaPath =
        `M ${firstX},${paddingTop + graphHeight}
         L ${windCoordinates.join(" L ")}
         L ${lastX},${paddingTop + graphHeight}
         Z`;

    /*
       GRID LINES
    */
    let gridLines = "";

    for (let i = 0; i <= 4; i++) {

        const y =
            paddingTop +
            (graphHeight / 4) * i;

        const value =
            maxWind -
            (maxWind / 4) * i;

        gridLines += `
            <line
                class="grid-line"
                x1="${paddingLeft}"
                y1="${y}"
                x2="${width - paddingRight}"
                y2="${y}"
            />

            <text
                class="axis-label"
                x="5"
                y="${y + 4}"
            >
                ${value.toFixed(0)}
            </text>
        `;
    }

    /*
       X-AXIS LABELS
    */
    let xLabels = "";

    points.forEach((point, index) => {

        const x =
            paddingLeft +
            index * xStep;

        xLabels += `
            <text
                class="axis-label"
                text-anchor="middle"
                x="${x}"
                y="${height - 12}"
            >
                ${escapeSvg(point.label)}
            </text>
        `;
    });

    /*
       RAIN DOTS
    */
    let rainDots = "";

    points.forEach((point, index) => {

        const x =
            paddingLeft +
            index * xStep;

        const y =
            rainY(point.rain);

        rainDots += `
            <circle
                class="rain-dot"
                cx="${x}"
                cy="${y}"
                r="4"
            >
                <title>
                    Rain: ${point.rain.toFixed(1)} mm
                </title>
            </circle>
        `;
    });

    /*
       WIND POINTS
    */
    let windPoints = "";

    points.forEach((point, index) => {

        const x =
            paddingLeft +
            index * xStep;

        const y =
            windY(point.wind);

        windPoints += `
            <circle
                class="wind-point"
                cx="${x}"
                cy="${y}"
                r="4"
            >
                <title>
                    Wind: ${point.wind.toFixed(1)} km/h
                </title>
            </circle>
        `;
    });

    /*
       RENDER GRAPH
    */
    svg.innerHTML = `
        <defs>
            <linearGradient
                id="windGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
            >
                <stop
                    offset="0%"
                    stop-opacity="0.35"
                />

                <stop
                    offset="100%"
                    stop-opacity="0"
                />
            </linearGradient>
        </defs>

        ${gridLines}

        <path
            class="wind-area"
            d="${areaPath}"
        />

        <path
            class="wind-line"
            d="${windPath}"
        />

        ${windPoints}

        ${rainDots}

        ${xLabels}
    `;
}


/* Format forecast labels */
function formatForecastTime(value, index) {

    if (!value) {
        return `${index + 1}h`;
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    return String(value);
}


/* Prevent API text from breaking SVG */
function escapeSvg(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   SVG HELPER
========================================================= */

function svgElement(
    name,
    attributes
) {

    const element =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            name
        );


    Object.entries(attributes)
        .forEach(
            ([key, value]) => {

                element.setAttribute(
                    key,
                    value
                );

            }
        );


    return element;

}


/* =========================================================
   LOAD ZONES
========================================================= */

async function loadZones() {

    if (!zonesContainer) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/zones`
            );


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        let zones =
            data.zones ||
            data ||
            [];


        if (!Array.isArray(zones)) {
            zones = [];
        }


        /*
           Always maintain four perimeter zones.
        */

        const defaultZones = [

            {
                name: "North Zone",
                status: "Monitoring",
                risk: 0,
                sensitivity: "LOW",
                condition: "Environmental monitoring active"
            },

            {
                name: "East Zone",
                status: "Monitoring",
                risk: 0,
                sensitivity: "LOW",
                condition: "Environmental monitoring active"
            },

            {
                name: "South Zone",
                status: "Monitoring",
                risk: 0,
                sensitivity: "LOW",
                condition: "Environmental monitoring active"
            },

            {
                name: "West Zone",
                status: "Monitoring",
                risk: 0,
                sensitivity: "LOW",
                condition: "Environmental monitoring active"
            }

        ];


        zones =
            defaultZones.map(
                (fallback, index) => {

                    return {

                        ...fallback,

                        ...(zones[index] || {})

                    };

                }
            );


        renderZones(
            zones.slice(0, 4)
        );

    } catch (error) {

        console.error(
            "VIGIL zones error:",
            error
        );


        /*
           Even when API fails,
           show four zones.
        */

        renderZones(
            getDefaultZones()
        );

    }

}


/* =========================================================
   DEFAULT ZONES
========================================================= */

function getDefaultZones() {

    return [

        {
            name: "North Zone",
            status: "Monitoring",
            risk: 0,
            sensitivity: "LOW",
            condition: "Environmental monitoring active"
        },

        {
            name: "East Zone",
            status: "Monitoring",
            risk: 0,
            sensitivity: "LOW",
            condition: "Environmental monitoring active"
        },

        {
            name: "South Zone",
            status: "Monitoring",
            risk: 0,
            sensitivity: "LOW",
            condition: "Environmental monitoring active"
        },

        {
            name: "West Zone",
            status: "Monitoring",
            risk: 0,
            sensitivity: "LOW",
            condition: "Environmental monitoring active"
        }

    ];

}


/* =========================================================
   RENDER ZONES
========================================================= */

function renderZones(zones) {

    if (!zonesContainer) {
        return;
    }


    zonesContainer.innerHTML =
        "";


    zones.forEach(
        (zone, index) => {

            const card =
                document.createElement("div");

            card.className =
                "zone-card";


            const name =
                zone.name ||
                `Zone ${index + 1}`;


            const status =
                zone.status ||
                zone.state ||
                "Monitoring";


            const risk =
                Number(
                    zone.risk ??
                    zone.risk_score ??
                    0
                ) || 0;


            const sensitivity =
                translateLevel(
                    zone.sensitivity ||
                    zone.recommendation ||
                    lastData?.recommendation ||
                    "LOW"
                );


            const conditionValue =
                zone.condition ||
                zone.description ||
                "Environmental monitoring active";


            card.innerHTML = `

                <div class="zone-header">

                    <span>
                        ZONE ${String(index + 1).padStart(2, "0")}
                    </span>

                    <strong>
                        ${status}
                    </strong>

                </div>


                <h3>
                    ${name}
                </h3>


                <div class="zone-risk">

                    <span>
                        Risk
                    </span>

                    <strong>
                        ${risk}/100
                    </strong>

                </div>


                <p>
                    Sensitivity:
                    <strong>
                        ${sensitivity}
                    </strong>
                </p>


                <p>
                    ${conditionValue}
                </p>

            `;


            zonesContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   LOAD HISTORY
========================================================= */

async function loadHistory() {

    if (!historyContainer) {
        return;
    }


    try {

        historyContainer.innerHTML = `

            <div class="history-empty">
                Loading history...
            </div>

        `;


        const response =
            await fetch(
                `${API_BASE_URL}/api/history`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        historyData =
            data.history ||
            data.records ||
            data ||
            [];


        if (!Array.isArray(historyData)) {
            historyData = [];
        }


        renderHistory(
            historyData
        );

    } catch (error) {

        console.error(
            "VIGIL history error:",
            error
        );


        historyContainer.innerHTML = `

            <div class="history-empty">
                Unable to load history.
            </div>

        `;

    }

}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderHistory(records) {

    if (!historyContainer) {
        return;
    }


    const search =
        (
            historySearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const filter =
        historyFilter?.value ||
        "all";


    const filtered =
        records.filter(
            (record) => {

                const location =
                    String(
                        record.location ||
                        record.city ||
                        ""
                    ).toLowerCase();


                const recommendation =
                    String(
                        record.recommendation ||
                        record.recommended_sensitivity ||
                        ""
                    ).toLowerCase();


                const conditionValue =
                    String(
                        record.condition ||
                        record.weather_condition ||
                        ""
                    ).toLowerCase();


                const searchMatch =
                    !search ||
                    location.includes(search) ||
                    recommendation.includes(search) ||
                    conditionValue.includes(search);


                const level =
                    levelClass(
                        recommendation
                    );


                const filterMatch =
                    filter === "all" ||
                    level === filter ||
                    (
                        filter === "normal" &&
                        recommendation === "medium"
                    );


                return (
                    searchMatch &&
                    filterMatch
                );

            }
        );


    historyContainer.innerHTML =
        "";


    if (filtered.length === 0) {

        historyContainer.innerHTML = `

            <div class="history-empty">
                ${t("noHistory")}
            </div>

        `;

        return;

    }


    filtered.forEach(
        (record, index) => {

            const row =
                document.createElement("div");

            row.className =
                "history-row";


            const recordId =
                record.id ??
                record._id ??
                record.timestamp ??
                index;


            const location =
                record.location ||
                record.city ||
                "Unknown";


            const timestamp =
                record.timestamp ||
                record.created_at ||
                record.date ||
                record.time ||
                "--";


            const recommendation =
                record.recommendation ||
                record.recommended_sensitivity ||
                "--";


            const risk =
                record.risk ??
                record.risk_score ??
                "--";


            const temperatureValue =
                record.temperature_c ??
                record.temperature ??
                record.weather?.temperature_c ??
                "--";


            const windValue =
                record.wind_speed_kmh ??
                record.wind ??
                record.weather?.wind_speed_kmh ??
                "--";


            const rainValue =
                record.rainfall_mm ??
                record.rainfall ??
                record.weather?.rainfall_mm ??
                "--";


            const level =
                levelClass(
                    recommendation
                );


            row.innerHTML = `

                <div class="history-location">

                    <strong>
                        ${escapeHtml(location)}
                    </strong>

                    <span>
                        ${formatHistoryDate(timestamp)}
                    </span>

                </div>


                <div class="history-item">

                    <span>
                        Recommendation
                    </span>

                    <strong
                        class="history-recommendation ${level}"
                    >
                        ${escapeHtml(
                translateLevel(
                    recommendation
                )
            )}
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Risk
                    </span>

                    <strong>
                        ${escapeHtml(
                String(risk)
            )}
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Temperature
                    </span>

                    <strong>
                        ${escapeHtml(
                String(temperatureValue)
            )}°C
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Wind
                    </span>

                    <strong>
                        ${escapeHtml(
                String(windValue)
            )} km/h
                    </strong>

                </div>


                <div class="history-item">

                    <span>
                        Rain
                    </span>

                    <strong>
                        ${escapeHtml(
                String(rainValue)
            )} mm
                    </strong>

                </div>


                <button
                    class="history-delete"
                    data-history-id="${escapeHtml(
                String(recordId)
            )}"
                    type="button"
                >
                    ${t("delete")}
                </button>

            `;


            const deleteButton =
                row.querySelector(
                    ".history-delete"
                );


            deleteButton?.addEventListener(
                "click",
                () => {

                    deleteHistoryRecord(
                        record,
                        index
                    );

                }
            );


            historyContainer.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   HISTORY DATE
========================================================= */

function formatHistoryDate(value) {

    if (!value) {
        return "--";
    }


    const date =
        new Date(value);


    if (!Number.isNaN(
        date.getTime()
    )) {

        return date.toLocaleString();

    }


    return String(value);

}


/* =========================================================
   DELETE HISTORY
========================================================= */

async function deleteHistoryRecord(
    record,
    index
) {

    const recordId =
        record.id ??
        record._id ??
        record.timestamp;


    if (
        !confirm(
            "Delete this history record?"
        )
    ) {
        return;
    }


    /*
       If the backend provides an ID,
       try the REST delete endpoint.
    */

    if (
        recordId !== undefined &&
        recordId !== null
    ) {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/history/${encodeURIComponent(recordId)}`,
                    {
                        method: "DELETE"
                    }
                );


            if (response.ok) {

                historyData =
                    historyData.filter(
                        item =>
                            (
                                item.id ??
                                item._id ??
                                item.timestamp
                            ) !== recordId
                    );


                renderHistory(
                    historyData
                );

                return;

            }

        } catch (error) {

            console.warn(
                "History delete API unavailable:",
                error
            );

        }

    }


    /*
       Fallback:
       remove it from the currently displayed
       client-side dataset.
    */

    historyData.splice(
        index,
        1
    );


    renderHistory(
        historyData
    );

}


/* =========================================================
   DOWNLOAD HISTORY REPORT
========================================================= */

function downloadHistoryReport() {

    if (
        !historyData ||
        historyData.length === 0
    ) {

        alert(
            "There is no history data available to download."
        );

        return;

    }


    const headers = [

        "Date",

        "Location",

        "Recommendation",

        "Risk",

        "Temperature (C)",

        "Wind Speed (km/h)",

        "Rainfall (mm)"

    ];


    const rows =
        historyData.map(
            (record) => {

                const location =
                    record.location ||
                    record.city ||
                    "";


                const timestamp =
                    record.timestamp ||
                    record.created_at ||
                    record.date ||
                    "";


                const recommendation =
                    record.recommendation ||
                    record.recommended_sensitivity ||
                    "";


                const risk =
                    record.risk ??
                    record.risk_score ??
                    "";


                const temperatureValue =
                    record.temperature_c ??
                    record.temperature ??
                    record.weather?.temperature_c ??
                    "";


                const windValue =
                    record.wind_speed_kmh ??
                    record.wind ??
                    record.weather?.wind_speed_kmh ??
                    "";


                const rainValue =
                    record.rainfall_mm ??
                    record.rainfall ??
                    record.weather?.rainfall_mm ??
                    "";


                return [

                    timestamp,

                    location,

                    recommendation,

                    risk,

                    temperatureValue,

                    windValue,

                    rainValue

                ];

            }
        );


    const csv = [

        headers,

        ...rows

    ]
        .map(
            row =>
                row
                    .map(
                        csvEscape
                    )
                    .join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `VIGIL_History_Report_${getDateStamp()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   CSV ESCAPE
========================================================= */

function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;

}


/* =========================================================
   DATE STAMP
========================================================= */

function getDateStamp() {

    const now =
        new Date();


    return [

        now.getFullYear(),

        String(
            now.getMonth() + 1
        ).padStart(2, "0"),

        String(
            now.getDate()
        ).padStart(2, "0")

    ].join("-");

}


downloadHistoryBtn?.addEventListener(
    "click",
    downloadHistoryReport
);


/* =========================================================
   HISTORY SEARCH
========================================================= */

historySearch?.addEventListener(
    "input",
    () => {

        renderHistory(
            historyData
        );

    }
);


historyFilter?.addEventListener(
    "change",
    () => {

        renderHistory(
            historyData
        );

    }
);


/* =========================================================
   ROI & IMPACT
========================================================= */

async function loadROIImpact() {

    const sampleSize =
        $("roi-sample-size");

    if (!sampleSize) {
        return;
    }


    const staticAlarms =
        $("roi-static-alarms");

    const dynamicAlarms =
        $("roi-dynamic-alarms");

    const reduction =
        $("roi-reduction");


    const compareStatic =
        $("compare-static");

    const compareDynamic =
        $("compare-dynamic");

    const impactReduction =
        $("impact-reduction");


    const staticBar =
        $("static-bar");

    const dynamicBar =
        $("dynamic-bar");


    const updated =
        $("roi-updated");

    const status =
        $("roi-status");


    try {

        if (updated) {

            updated.textContent =
                "Loading simulation data...";

        }


        if (status) {

            status.textContent =
                "Connecting...";

        }


        const response =
            await fetch(
                `${API_BASE_URL}/api/simulate`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        const sample =
            Number(
                data.sample_size || 0
            );


        const staticPolicy =
            Number(
                data.static_policy_alarms || 0
            );


        const dynamicPolicy =
            Number(
                data.dynamic_policy_alarms || 0
            );


        const reductionValue =
            Number(
                data.estimated_false_alarm_reduction_pct || 0
            );


        setText(
            sampleSize,
            sample
        );

        setText(
            staticAlarms,
            staticPolicy
        );

        setText(
            dynamicAlarms,
            dynamicPolicy
        );


        if (reduction) {

            reduction.textContent =
                `${reductionValue.toFixed(1)}%`;

        }


        setText(
            compareStatic,
            staticPolicy
        );

        setText(
            compareDynamic,
            dynamicPolicy
        );


        if (impactReduction) {

            impactReduction.textContent =
                `${reductionValue.toFixed(1)}%`;

        }


        const maximum =
            Math.max(
                staticPolicy,
                dynamicPolicy,
                1
            );


        if (staticBar) {

            staticBar.style.width =
                `${(
                    staticPolicy /
                    maximum
                ) * 100}%`;

        }


        if (dynamicBar) {

            dynamicBar.style.width =
                `${(
                    dynamicPolicy /
                    maximum
                ) * 100}%`;

        }


        if (status) {

            status.textContent =
                "Simulation Connected";

        }


        if (updated) {

            if (sample > 0) {

                updated.textContent =
                    `Data loaded · ${new Date()
                        .toLocaleTimeString()
                    }`;

            } else {

                updated.textContent =
                    "No historical simulation records available";

            }

        }

    } catch (error) {

        console.error(
            "VIGIL ROI simulation error:",
            error
        );


        setText(
            sampleSize,
            "—"
        );

        setText(
            staticAlarms,
            "—"
        );

        setText(
            dynamicAlarms,
            "—"
        );


        if (reduction) {
            reduction.textContent =
                "—%";
        }


        setText(
            compareStatic,
            "—"
        );

        setText(
            compareDynamic,
            "—"
        );


        if (impactReduction) {
            impactReduction.textContent =
                "—%";
        }


        if (staticBar) {
            staticBar.style.width =
                "0%";
        }


        if (dynamicBar) {
            dynamicBar.style.width =
                "0%";
        }


        if (status) {

            status.textContent =
                "Simulation Unavailable";

        }


        if (updated) {

            updated.textContent =
                "Unable to load simulation data";

        }

    }

}
// clear all history
const clearHistoryBtn = document.getElementById(
    "clearHistoryBtn"
);

if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener(
        "click",
        async () => {

            const confirmed = confirm(
                "Are you sure you want to clear all decision history?\n\n" +
                "This action cannot be undone."
            );

            if (!confirmed) {
                return;
            }

            try {

                const response = await fetch(
                    `${API_BASE_URL}/api/history`,
                    {
                        method: "DELETE"
                    }
                );

                const result = await response.json();

                if (!response.ok) {

                    alert(
                        result.error ||
                        "Unable to clear history."
                    );

                    return;
                }

                alert(
                    "All decision history has been cleared."
                );

                // Reload history
                loadHistory();

            } catch (error) {

                console.error(
                    "Clear history error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}

/* =========================================================
   APPLY RECOMMENDATION
========================================================= */

async function applyRecommendation() {
    if (!lastData) {
        alert("No recommendation is currently available.");
        return;
    }

    // Backend expects sensitivity, not recommendation.
    const sensitivity = lastData.recommendation;

    const buttons = [
        $("applyRecommendationBtnOverview"),
        $("applyRecommendationBtnZones")
    ].filter(Boolean);

    buttons.forEach(button => {
        button.disabled = true;
        button.textContent = "Applying...";
    });

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/apply-recommendation`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sensitivity: sensitivity
                })
            }
        );

        // Read the backend's actual error message if one occurs.
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || `HTTP ${response.status}`
            );
        }

        // Update the frontend's current sensitivity.
        lastData.active_sensitivity =
            result.active_sensitivity;

        buttons.forEach(button => {
            button.textContent = "Applied";
        });

        // Refresh zone information if your existing function exists.
        if (typeof loadZones === "function") {
            await loadZones();
        }

        if (typeof updateDashboard === "function") {
            // Do not call updateDashboard here unless it is designed
            // to accept the complete recommendation response.
        }

        alert(result.message);

    } catch (error) {
        console.error(
            "Apply recommendation error:",
            error
        );

        alert(
            "Unable to apply recommendation: " +
            error.message
        );

    } finally {
        buttons.forEach(button => {
            button.disabled = false;
            button.textContent = "Apply Recommendation";
        });
    }
}


$("applyRecommendationBtnOverview")
    ?.addEventListener(
        "click",
        applyRecommendation
    );


$("applyRecommendationBtnZones")
    ?.addEventListener(
        "click",
        applyRecommendation
    );


/* =========================================================
   LOCATION UPDATE
========================================================= */

updateLocationBtn?.addEventListener(
    "click",
    () => {

        const city =
            locationInput?.value
                ?.trim();


        if (!city) {

            alert(
                "Please enter a location."
            );

            return;

        }


        loadVigilData(city);

    }
);


locationInput?.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            updateLocationBtn?.click();

        }

    }
);


/* =========================================================
   REFRESH
========================================================= */

refreshBtn?.addEventListener(
    "click",
    () => {

        const city =
            locationInput?.value
                ?.trim() ||
            "Pune";


        loadVigilData(city);


        if (currentTab === "operations") {
            loadZones();
        }


        if (currentTab === "history") {
            loadHistory();
        }


        if (currentTab === "roi") {
            loadROIImpact();
        }

    }
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeVigil() {

    /*
       Restore saved tab.
    */

    const savedTab =
        localStorage.getItem(
            "vigil-tab"
        );


    if (
        savedTab &&
        navigationTitles[savedTab]
    ) {

        activateTab(
            savedTab
        );

    } else {

        activateTab(
            "overview"
        );

    }


    /*
       Load main recommendation.
    */

    const city =
        locationInput?.value
            ?.trim() ||
        "Pune";


    await loadVigilData(
        city
    );


    /*
       Load zones.
    */

    await loadZones();


    /*
       Load history.
    */

    await loadHistory();


    /*
       Load ROI.
    */

    await loadROIImpact();

}


document.addEventListener(
    "DOMContentLoaded",
    initializeVigil
);