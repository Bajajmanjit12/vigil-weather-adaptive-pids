/* =========================================================
   VIGIL — ROI & IMPACT
   Connects the ROI page to /api/simulate
   ========================================================= */

async function loadROIImpact() {

    const sampleSize = document.getElementById("roi-sample-size");
    const staticAlarms = document.getElementById("roi-static-alarms");
    const dynamicAlarms = document.getElementById("roi-dynamic-alarms");
    const reduction = document.getElementById("roi-reduction");

    const compareStatic = document.getElementById("compare-static");
    const compareDynamic = document.getElementById("compare-dynamic");

    const impactReduction =
        document.getElementById("impact-reduction");

    const staticBar =
        document.getElementById("static-bar");

    const dynamicBar =
        document.getElementById("dynamic-bar");

    const updated =
        document.getElementById("roi-updated");


    try {

        updated.textContent = "Loading simulation data...";


        const response = await fetch("/api/simulate");


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data = await response.json();


        const sample = Number(data.sample_size || 0);

        const staticPolicy =
            Number(data.static_policy_alarms || 0);

        const dynamicPolicy =
            Number(data.dynamic_policy_alarms || 0);

        const reductionValue =
            Number(
                data.estimated_false_alarm_reduction_pct || 0
            );


        /* ---------- SUMMARY CARDS ---------- */

        sampleSize.textContent = sample;

        staticAlarms.textContent = staticPolicy;

        dynamicAlarms.textContent = dynamicPolicy;

        reduction.textContent =
            `${reductionValue.toFixed(1)}%`;


        /* ---------- COMPARISON ---------- */

        compareStatic.textContent =
            staticPolicy;

        compareDynamic.textContent =
            dynamicPolicy;

        impactReduction.textContent =
            `${reductionValue.toFixed(1)}%`;


        /* ---------- BAR CALCULATION ---------- */

        const maximum =
            Math.max(
                staticPolicy,
                dynamicPolicy,
                1
            );


        const staticWidth =
            (staticPolicy / maximum) * 100;

        const dynamicWidth =
            (dynamicPolicy / maximum) * 100;


        staticBar.style.width =
            `${staticWidth}%`;

        dynamicBar.style.width =
            `${dynamicWidth}%`;


        /* ---------- STATUS ---------- */

        if (sample > 0) {

            updated.textContent =
                `Data loaded · ${new Date().toLocaleTimeString()}`;

        } else {

            updated.textContent =
                "No historical simulation records available";

        }


    } catch (error) {

        console.error(
            "VIGIL ROI simulation error:",
            error
        );


        sampleSize.textContent = "—";

        staticAlarms.textContent = "—";

        dynamicAlarms.textContent = "—";

        reduction.textContent = "—%";

        compareStatic.textContent = "—";

        compareDynamic.textContent = "—";

        impactReduction.textContent = "—%";

        staticBar.style.width = "0%";

        dynamicBar.style.width = "0%";


        updated.textContent =
            "Unable to load simulation data";

    }

}


/* ---------- INITIAL LOAD ---------- */

loadROIImpact();