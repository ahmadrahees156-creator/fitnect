const { predictImageAnalysis } = require("../services/imageAnalysisService");

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_EXTENSIONS = /\.(jpe?g|png)$/i;

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;

  // JPEG magic bytes: 0xFF 0xD8 0xFF
  const isJpeg =
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG magic bytes: 0x89 0x50 0x4E 0x47 (\x89PNG)
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  return isJpeg || isPng;
}

function getImageMimeType(buffer, filename) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return "image/png";
  }
  return "image/jpeg";
}

/**
 * Controller to handle photo injury analysis requests
 * POST /api/image-analysis/predict
 */
async function analyzeInjuryPhoto(req, res, next) {
  try {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return res.status(400).json({
        success: false,
        message: "Request must be multipart/form-data with an image field.",
      });
    }

    const contentLength = Number(req.headers["content-length"] || 0);
    // Allow a small padding for multipart headers/boundaries
    if (contentLength > MAX_IMAGE_SIZE + 20480) {
      return res.status(413).json({
        success: false,
        message: "Image is too large. Maximum size is 8 MB.",
      });
    }

    let formData;
    try {
      const webReq = new Request("http://localhost" + req.url, {
        method: req.method,
        headers: req.headers,
        body: req,
        duplex: "half",
      });
      formData = await webReq.formData();
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Failed to parse multipart upload. Please verify the image payload.",
      });
    }

    const file = formData.get("image");

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    const filename = String(file.name || "upload.jpg").trim();

    if (!ALLOWED_EXTENSIONS.test(filename)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, JPEG, and PNG images are allowed.",
      });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(413).json({
        success: false,
        message: "Image is too large. Maximum size is 8 MB.",
      });
    }

    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded image file is empty.",
      });
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (!isValidImageBuffer(buffer)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, JPEG, and PNG images are allowed. The uploaded file is not a valid image.",
      });
    }

    const mimetype = getImageMimeType(buffer, filename);

    const result = await predictImageAnalysis({
      buffer,
      originalname: filename,
      mimetype,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.details?.message ? { details: error.details.message } : {}),
      });
    }

    next(error);
  }
}

module.exports = {
  analyzeInjuryPhoto,
};
