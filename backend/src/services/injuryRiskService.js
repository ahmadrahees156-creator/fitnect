
const predictInjuryRisk = async (inputData) => {
    const mlServiceUrl = process.env.ML_SERVICE_URL;

    if (!mlServiceUrl) {
        throw new Error("ML_SERVICE_URL is not configured.");
    }

    let response;

    try {
        response = await fetch(
            `${mlServiceUrl.replace(/\/+$/, "")}/predict`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(inputData),
                signal: AbortSignal.timeout(15000),
            }
        );
    } catch (error) {
        const serviceError = new Error(
            "The injury prediction service is unavailable."
        );
        serviceError.statusCode = 503;
        throw serviceError;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        const serviceError = new Error(
            response.status >= 500
                ? "The injury prediction service failed."
                : result?.error || "Invalid prediction request."
        );

        serviceError.statusCode =
            response.status >= 500 ? 502 : response.status;

        throw serviceError;
    }

    return result;
};

module.exports = { predictInjuryRisk };
