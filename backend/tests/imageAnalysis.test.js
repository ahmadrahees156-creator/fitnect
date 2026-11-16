const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

let appServer;
let baseUrl;
let mockCnnServer;
let mockCnnPort;
let originalCnnUrl;

const testUser = {
  id: "64b1f2e9a1b2c3d4e5f6a7b8",
  role: "user",
};

const jwtSecret = process.env.JWT_SECRET || "test_jwt_secret_fitnect_test_suite_123456";
const authToken = jwt.sign(testUser, jwtSecret, { expiresIn: "1h" });

// Sample minimal valid 1x1 JPEG buffer: FF D8 FF E0 00 10 4A 46 49 46
const validJpegBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0xff, 0xd9
]);

// Sample minimal valid PNG buffer: 89 50 4E 47 0D 0A 1A 0A
const validPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

test.before(async () => {
  originalCnnUrl = process.env.CNN_IMAGE_API_URL;

  // Start a mock CNN server
  mockCnnServer = http.createServer(async (req, res) => {
    if (req.url === "/predict-image" && req.method === "POST") {
      try {
        const webReq = new Request("http://localhost" + req.url, {
          method: req.method,
          headers: req.headers,
          body: req,
          duplex: "half",
        });
        const fd = await webReq.formData();
        const file = fd.get("image");

        if (file && file.name.includes("unsupported")) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Invalid or unsupported image",
              message: "Arm images are not currently supported. Please upload a foot or lower-limb photo.",
            })
          );
          return;
        }

        if (file && file.name.includes("groq")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              prediction: "Normal",
              confidence: 88.5,
              body_part: "foot",
              visible_description: "Healthy skin appearance",
              gemini_explanation: "Groq backup: No visible pathological lesion detected on the lower extremity.",
              care_suggestions: [
                "Maintain general foot hygiene",
                "Wear proper footwear during exercise"
              ],
              gemini_available: false,
              groq_available: true,
              explanation_provider: "groq",
              validation_status: "verified",
              disclaimer: "AI image classification is not a medical diagnosis."
            })
          );
          return;
        }

        if (file && file.name.includes("fallback")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              prediction: "Normal",
              confidence: 76.2,
              body_part: "lower_limb",
              visible_description: "General lower limb image",
              gemini_explanation: "Classification output: Normal (Confidence: 76.2%). Note: Detailed narrative explanations from AI providers were unavailable.",
              care_suggestions: [
                "Monitor for any change in symptoms",
                "Consult a physician if you experience persistent pain"
              ],
              gemini_available: false,
              groq_available: false,
              explanation_provider: "cnn_fallback",
              validation_status: "not_verified",
              disclaimer: "AI image classification is not a medical diagnosis."
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            prediction: "Wound",
            confidence: 94.8,
            body_part: "foot",
            visible_description: "Abrasion visible over the lateral ankle region",
            gemini_explanation: "The CNN identified superficial tissue disruption consistent with an active skin wound.",
            care_suggestions: [
              "Clean gently with saline solution",
              "Keep the area protected from dirt and excessive friction",
              "Consult a qualified medical provider if pain or swelling increases"
            ],
            gemini_available: true,
            groq_available: false,
            explanation_provider: "gemini",
            validation_status: "verified",
            disclaimer: "AI image classification is not a medical diagnosis. Model confidence does not indicate injury severity."
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => {
    mockCnnServer.listen(0, "127.0.0.1", () => {
      mockCnnPort = mockCnnServer.address().port;
      process.env.CNN_IMAGE_API_URL = `http://127.0.0.1:${mockCnnPort}`;
      resolve();
    });
  });

  // Start app server
  await new Promise((resolve) => {
    appServer = http.createServer(app);
    appServer.listen(0, "127.0.0.1", () => {
      const port = appServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (originalCnnUrl) {
    process.env.CNN_IMAGE_API_URL = originalCnnUrl;
  } else {
    delete process.env.CNN_IMAGE_API_URL;
  }

  await new Promise((resolve) => appServer.close(resolve));
  await new Promise((resolve) => mockCnnServer.close(resolve));
});

test("POST /api/image-analysis/predict rejects unauthenticated requests with 401", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "foot.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    body: fd,
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("POST /api/image-analysis/predict rejects non-multipart request with 400", async () => {
  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: "base64" }),
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /multipart\/form-data/);
});

test("POST /api/image-analysis/predict rejects missing image field with 400", async () => {
  const fd = new FormData();
  fd.append("other_field", "value");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Please upload an image/);
});

test("POST /api/image-analysis/predict rejects invalid file extension with 400", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([Buffer.from("text file")], { type: "text/plain" }), "notes.txt");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Only JPG, JPEG, and PNG images are allowed/);
});

test("POST /api/image-analysis/predict rejects corrupted or non-JPEG/PNG buffer with 400", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([Buffer.from("not an image at all")], { type: "image/jpeg" }), "fake.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /not a valid image/);
});

test("POST /api/image-analysis/predict rejects image larger than 8 MB with 413", async () => {
  // 8 MB + 1 byte
  const oversizedBuffer = Buffer.alloc(8 * 1024 * 1024 + 1);
  oversizedBuffer[0] = 0xff;
  oversizedBuffer[1] = 0xd8;
  oversizedBuffer[2] = 0xff;

  const fd = new FormData();
  fd.append("image", new Blob([oversizedBuffer], { type: "image/jpeg" }), "large.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 413);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Image is too large/);
});

test("POST /api/image-analysis/predict forwards valid JPEG and returns normalized prediction", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "ankle.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.prediction, "Wound");
  assert.equal(data.confidence, 94.8);
  assert.equal(data.body_part, "foot");
  assert.equal(data.visible_description, "Abrasion visible over the lateral ankle region");
  assert.ok(data.gemini_explanation);
  assert.ok(Array.isArray(data.care_suggestions) && data.care_suggestions.length > 0);
  assert.equal(data.gemini_available, true);
  assert.equal(data.groq_available, false);
  assert.equal(data.explanation_provider, "gemini");
  assert.equal(data.validation_status, "verified");
  assert.match(data.disclaimer, /medical diagnosis/);
});

test("POST /api/image-analysis/predict handles Groq backup provider response", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "groq_foot.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.prediction, "Normal");
  assert.equal(data.confidence, 88.5);
  assert.equal(data.gemini_available, false);
  assert.equal(data.groq_available, true);
  assert.equal(data.explanation_provider, "groq");
  assert.equal(data.validation_status, "verified");
  assert.match(data.gemini_explanation, /Groq backup/);
});

test("POST /api/image-analysis/predict handles CNN fallback provider response when both LLMs are down", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "fallback_foot.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.prediction, "Normal");
  assert.equal(data.gemini_available, false);
  assert.equal(data.groq_available, false);
  assert.equal(data.explanation_provider, "cnn_fallback");
  assert.equal(data.validation_status, "not_verified");
  assert.match(data.gemini_explanation, /unavailable/);
});

test("POST /api/image-analysis/predict forwards valid PNG successfully", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validPngBuffer], { type: "image/png" }), "foot.png");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.prediction, "Wound");
});

test("POST /api/injury-analysis/predict alias route works identically", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "ankle.jpg");

  const res = await fetch(`${baseUrl}/api/injury-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.prediction, "Wound");
});

test("POST /api/image-analysis/predict handles unsupported body part error from CNN service", async () => {
  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "unsupported_arm.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Arm images are not currently supported/);
});

test("POST /api/image-analysis/predict returns 503 when external CNN service is unreachable", async () => {
  // Point to a non-existent port
  process.env.CNN_IMAGE_API_URL = "http://127.0.0.1:59999";

  const fd = new FormData();
  fd.append("image", new Blob([validJpegBuffer], { type: "image/jpeg" }), "foot.jpg");

  const res = await fetch(`${baseUrl}/api/image-analysis/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: fd,
  });

  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /unavailable/);

  // Restore
  process.env.CNN_IMAGE_API_URL = `http://127.0.0.1:${mockCnnPort}`;
});
