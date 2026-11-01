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
      signal: AbortSignal.timeout(35000),
    });
  } catch (error) {
    const isTimeout = error.name === "TimeoutError" || error.code === 23;
    const serviceError = new Error(
      isTimeout
        ? "The image analysis service timed out. Please try again."
        : "The image analysis service is unavailable. Please try again."
    );
    serviceError.statusCode = 503;
    throw serviceError;
  }

  const rawText = await response.text().catch(() => "");
  let result = null;

  try {
    result = rawText ? JSON.parse(rawText) : null;
  } catch {
    result = null;
  }

  if (!response.ok) {
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
    const err = new Error(
      "The image analysis service returned an invalid response."
    );
    err.statusCode = 502;
    throw err;
  }

  // Preserve external service contract
  return {
    success: true,
    prediction: result.prediction || "Normal",
    confidence: Number(result.confidence) || 0,
    body_part: result.body_part || "lower_limb",
    visible_description: result.visible_description || "",
    gemini_explanation: result.gemini_explanation || "",
    care_suggestions: Array.isArray(result.care_suggestions)
      ? result.care_suggestions
      : [],
    disclaimer:
      result.disclaimer ||
      "AI image classification is not a medical diagnosis. Model confidence does not indicate injury severity.",
  };
}

module.exports = {
  predictImageAnalysis,
  getCnnBaseUrl,
};
