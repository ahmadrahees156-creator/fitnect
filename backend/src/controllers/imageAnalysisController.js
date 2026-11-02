const multer = require("multer");
const { predictImageAnalysis } = require("../services/imageAnalysisService");

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_EXTENSIONS = /\.(jpe?g|png)$/i;

// Configure Multer with memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const filename = String(file.originalname || "").trim();

    if (!ALLOWED_EXTENSIONS.test(filename)) {
      const err = new Error("Only JPG, JPEG, and PNG images are allowed.");
      err.statusCode = 400;
      err.code = "INVALID_FILE_TYPE";
      return cb(err, false);
    }

    cb(null, true);
  },
});

/**
 * Middleware wrapper for upload.single("image") with strict error handling
 */
const uploadImageMiddleware = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return res.status(400).json({
      success: false,
      message: "Request must be multipart/form-data with an image field.",
    });
  }

  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message: "Image is too large. Maximum size is 8 MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "File upload error.",
      });
    }

    next();
  });
};

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
    const file = req.file;

    if (!file || !file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    if (file.size === 0 || file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded image file is empty.",
      });
    }

    if (!isValidImageBuffer(file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, JPEG, and PNG images are allowed. The uploaded file is not a valid image.",
      });
    }

    const filename = String(file.originalname || "upload.jpg").trim();
    const mimetype = getImageMimeType(file.buffer, filename);

    const result = await predictImageAnalysis({
      buffer: file.buffer,
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
  upload,
  uploadImageMiddleware,
  analyzeInjuryPhoto,
};
