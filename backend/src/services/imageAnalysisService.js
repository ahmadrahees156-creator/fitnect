const CNN_REQUEST_TIMEOUT_MS = 300000; // 5 minutes (300,000 ms)

function getCnnBaseUrl() {
  return (
    process.env.CNN_IMAGE_API_URL || "https://fitnect-cnn-api.onrender.com"
  ).replace(/\/+$/, "");
}

/**
 * Forwards an image buffer to the external FitNect CNN microservice
 * at https://fitnect-cnn-api.onrender.com/predict-image
 *
 * @param {Object} fileData
 * @param {Buffer} fileData.buffer - Raw image bytes
 * @param {string} fileData.originalname - Filename
 * @param {string} fileData.mimetype - MIME type (image/jpeg or image/png)
 * @returns {Promise<Object>} Normalized analysis response
 */
async function predictImageAnalysis({ buffer, originalname, mimetype }) {
  const url = `${getCnnBaseUrl()}/predict-image`;

  console.log(
    `[ImageAnalysis] Sending request to CNN service: URL=${url}, filename="${originalname}", size=${buffer.length} bytes, timeout=${CNN_REQUEST_TIMEOUT_MS}ms`
  );

  const formData = new FormData();
  formData.append(
    "image",
    new Blob([buffer], { type: mimetype }),
    originalname || "image.jpg"
  );

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(CNN_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout =
      error.name === "TimeoutError" ||
      error.name === "AbortError";

    if (isTimeout) {
      console.error(
        `[ImageAnalysis] CNN service request timed out after ${CNN_REQUEST_TIMEOUT_MS}ms: URL=${url}`
      );
    } else {
      console.error(
        `[ImageAnalysis] CNN service connection failure: URL=${url}, error=${error.message}`,
        {
          name: error.name,
          cause: error.cause?.message,
          code: error.cause?.code,
        }
      );
    }

    const serviceError = new Error(
      isTimeout
        ? "The image analysis service timed out. Please try again later."
        : "Photo analysis is temporarily unavailable. Please try again later."
    );

    serviceError.statusCode = 503;
    throw serviceError;
  }

  console.log(`[ImageAnalysis] CNN service response: status=${response.status}`);

  const rawText = await response.text().catch(() => "");
  let result = null;

  try {
    result = rawText ? JSON.parse(rawText) : null;
  } catch {
    result = null;
  }

  if (!response.ok) {
    console.error(
      `[ImageAnalysis] CNN service returned error HTTP ${response.status}:`,
      result || rawText
    );

    if (response.status === 413) {
      const err = new Error("Image is too large. Maximum size is 8 MB.");
      err.statusCode = 413;
      throw err;
    }

    if (response.status === 400) {
      const message =
        result?.message ||
        result?.error ||
        "Invalid or unsupported image. Please upload a clear photo of a foot or lower limb.";
      const err = new Error(message);
      err.statusCode = 400;
      err.details = result;
      throw err;
    }

    const err = new Error(
      result?.error ||
      result?.message ||
      `Image analysis service failed with status ${response.status}.`
    );
    err.statusCode = response.status >= 500 ? 502 : response.status;
    throw err;
  }

  if (!result || typeof result !== "object") {
    console.error(
      "[ImageAnalysis] CNN service returned invalid non-JSON response:",
      rawText
    );
    const err = new Error(
      "The image analysis service returned an invalid response."
    );
    err.statusCode = 502;
    throw err;
  }

  // Preserve external service contract including Gemini-primary / Groq-backup fields
  return {
    success: result.success !== undefined ? Boolean(result.success) : true,
    prediction: result.prediction || "Normal",
    confidence: Number(result.confidence) || 0,
    body_part: result.body_part || "unknown",
    visible_description: result.visible_description || "",
    gemini_explanation: result.gemini_explanation || "",
    care_suggestions: Array.isArray(result.care_suggestions)
      ? result.care_suggestions
      : [],
    gemini_available:
      typeof result.gemini_available === "boolean"
        ? result.gemini_available
        : false,
    groq_available:
      typeof result.groq_available === "boolean"
        ? result.groq_available
        : false,
    explanation_provider: result.explanation_provider || "cnn_fallback",
    validation_status:
      result.validation_status ||
      (result.prediction === "Invalid Image" ? "invalid" : "not_verified"),
    disclaimer:
      result.disclaimer ||
      "AI image output is not a medical diagnosis. Consult a qualified healthcare professional for assessment.",
  };
}

module.exports = {
  predictImageAnalysis,
  getCnnBaseUrl,
  CNN_REQUEST_TIMEOUT_MS,
};
