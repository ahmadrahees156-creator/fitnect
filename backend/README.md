# FitNect Backend API

FitNect is a fitness and wellness application backend built with Node.js, Express, and MongoDB. It provides account and profile management, workout logging, wellness and recovery check-ins, hydration and nutrition tracking, dashboards, activity history, coach–athlete connections, injury-risk prediction, and photo-based injury image analysis through an external CNN service.

## Deployment

**Production API:** https://fitnect-api-1k4t.onrender.com

**Health endpoint:** https://fitnect-api-1k4t.onrender.com/api/health

**Local development:** http://localhost:5000

The deployed service is hosted on Render. A successful response from `/api/health` confirms that the health route is responding; it does not by itself verify MongoDB or every external integration.

## Contents

- [Technology](#technology)
- [Project structure](#project-structure)
- [Request lifecycle](#request-lifecycle)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Nutrition API aliases](#nutrition-api-aliases)
- [Image analysis](#image-analysis)
- [Environment configuration](#environment-configuration)
- [Run locally](#run-locally)
- [Data and date handling](#data-and-date-handling)
- [Error responses](#error-responses)
- [Testing and verification](#testing-and-verification)
- [Integration notes](#integration-notes)
- [Medical disclaimer](#medical-disclaimer)

## Technology

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express | HTTP server, routing, and middleware |
| MongoDB | Persistent application data |
| Mongoose | MongoDB models, queries, and aggregation |
| `dotenv` | Loads local environment variables |
| `cors` | Cross-origin request configuration |
| `helmet` | HTTP security headers |
| JWT/token service | Authenticated API requests |
| `bcryptjs` | Password hashing and comparison |
| Node.js `crypto` | Cryptographic operations |
| Brevo | Transactional email delivery |
| Multipart upload middleware | Receives injury-analysis images |
| External nutrition service | Food search and nutrition information |
| External CNN service | Image inference and explanation generation |

Dependency versions are defined by the backend's package manifest and lockfile.

## Project structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── activityHistoryController.js
│   │   ├── authController.js
│   │   ├── coachAthleteController.js
│   │   ├── dashboardController.js
│   │   ├── fitnessProfileController.js
│   │   ├── fitnessRecommendationController.js
│   │   ├── foodController.js
│   │   ├── googleAuthController.js
│   │   ├── hydrationController.js
│   │   ├── injuryRiskController.js
│   │   ├── insightsController.js
│   │   ├── nutritionApiController.js
│   │   ├── nutritionController.js
│   │   ├── nutritionGoalController.js
│   │   ├── recoveryController.js
│   │   ├── userController.js
│   │   ├── wellnessController.js
│   │   ├── workoutController.js
│   │   ├── workoutLibraryController.js
│   │   └── workoutStatsController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── authorizeRoles.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── CoachAthlete.js
│   │   ├── EmailOTP.js
│   │   ├── FitnessProfile.js
│   │   ├── Food.js
│   │   ├── Hydration.js
│   │   ├── Nutrition.js
│   │   ├── NutritionGoal.js
│   │   ├── PasswordResetToken.js
│   │   ├── User.js
│   │   ├── WellnessCheckIn.js
│   │   ├── Workout.js
│   │   └── WorkoutLibrary.js
│   ├── routes/
│   ├── scripts/
│   │   ├── importFoods.js
│   │   └── importWorkouts.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── fitnessRecommendationService.js
│   │   ├── injuryRiskService.js
│   │   ├── nutritionApiService.js
│   │   ├── otpService.js
│   │   └── tokenService.js
│   ├── app.js
│   └── server.js
└── package.json
```

## Request lifecycle

1. The client sends an HTTP request to an API route.
2. `app.js` dispatches the request to the mounted router.
3. Protected routes pass through `authMiddleware.js`.
4. The route invokes its controller.
5. The controller validates input and calls a model or service.
6. Mongoose accesses MongoDB, or a service communicates with an external provider.
7. The controller returns a JSON response.
8. Errors are handled by the route or central error middleware.

Routes define HTTP methods and paths. Controllers implement request handling. Models define persisted data. Services contain reusable operations and external integrations. Middleware runs before or around route handlers.

## Authentication

Protected endpoints require a valid access token in the request header:

```http
Authorization: Bearer
Content-Type: application/json
```

Obtain the access token through the login flow and send it after `Bearer` in the authorization header. Do not commit tokens, passwords, reset links, API keys, or JWT secrets.

### Authentication endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Registers an account and initiates email verification |
| POST | `/api/auth/verify-email` | Public | Verifies an account using an email OTP |
| POST | `/api/auth/resend-otp` | Public | Requests another verification OTP |
| POST | `/api/auth/login` | Public | Authenticates using account credentials |
| POST | `/api/auth/google` | Public | Handles Google sign-in credentials |
| PATCH | `/api/auth/change-password` | Protected | Changes the authenticated user's password |
| POST | `/api/auth/forgot-password` | Public | Initiates the password-reset email flow |
| POST | `/api/auth/reset-password` | Public | Validates a reset token and updates the password |

Password-reset links are built using `FRONTEND_URL` and the email service. Email delivery also depends on the Brevo configuration. A successful API response does not guarantee inbox delivery; check backend and provider logs if an email is not received.

## API reference

All paths are relative to `https://fitnect-api-1k4t.onrender.com`. Unless marked public, the endpoints below require authentication.

### Root and health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Returns service status information |
| GET | `/api/health` | Public | Returns a basic health response |

A health response confirms that the health route is responding. It does not guarantee that MongoDB or every external provider is available.

### User profile — `/api/users`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/users/me` | Protected | Retrieves the authenticated user's profile |
| PATCH | `/api/users/me` | Protected | Updates permitted fields on the authenticated user's profile |

The user identity is derived from the verified authentication context.

### Fitness profile — `/api/fitness-profile`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/fitness-profile/me` | Protected | Retrieves the current user's fitness profile |
| PUT | `/api/fitness-profile/me` | Protected | Creates or updates the current user's fitness profile |

The fitness profile supplies information used by personalised fitness and nutrition features.

### Fitness recommendations — `/api/fitness-recommendations`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/fitness-recommendations/me` | Protected | Retrieves recommendations for the authenticated user |

Retrieving a recommendation does not create a workout log. To add a workout to history, send a separate request to `POST /api/workouts`.

### Workout logs — `/api/workouts`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/workouts` | Creates a workout log |
| GET | `/api/workouts` | Lists the authenticated user's workout logs |
| GET | `/api/workouts/stats` | Returns workout statistics |
| GET | `/api/workouts/:id` | Retrieves a workout by ID |
| PATCH | `/api/workouts/:id` | Updates a workout |
| DELETE | `/api/workouts/:id` | Deletes a workout |

Example request body for creating a workout:

```json
{
  "title": "Full Body Workout",
  "category": "strength",
  "durationMinutes": 30,
  "exercises": [
    {
      "name": "Squats"
    }
  ],
  "notes": "Beginner session"
}
```

The accepted category values and additional validation rules are defined by the workout model and controller.

### Workout library — `/api/workout-library`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/workout-library` | Lists predefined workouts and exercises |
| GET | `/api/workout-library/:id` | Retrieves one library item |

At startup, the server checks whether the workout library contains entries and attempts to import initial workouts if it is empty. Check server logs if the library is empty after startup.

### Wellness — `/api/wellness`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/wellness` | Saves a wellness check-in |
| GET | `/api/wellness/today` | Retrieves today's wellness information |
| GET | `/api/wellness/history` | Retrieves previous wellness check-ins |

### Recovery — `/api/recovery`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/recovery` | Saves or updates recovery-related information |
| GET | `/api/recovery/today` | Retrieves today's recovery information |
| GET | `/api/recovery/history` | Retrieves recovery history |

The recovery routes handle recovery-related records associated with wellness check-ins. They should not be interpreted as a separate persisted machine-learning recovery-score history.

### Hydration — `/api/hydration`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/hydration` | Saves a hydration entry |
| GET | `/api/hydration/today` | Retrieves today's hydration information |
| GET | `/api/hydration/history` | Retrieves hydration history |

The `amountMl` field is used by activity-history aggregation. Refer to the hydration model and controller for the accepted request fields and units.

### Nutrition diary — `/api/nutrition`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/nutrition` | Creates a nutrition diary entry |
| POST | `/api/nutrition/from-catalogue` | Creates a diary entry using catalogue food information |
| GET | `/api/nutrition/today` | Retrieves today's nutrition entries and summary |
| GET | `/api/nutrition/history` | Retrieves nutrition history |

Food search and food logging are separate operations. After a user selects a food, the client must call a diary creation endpoint to record it.

### Nutrition service — `/api/nutrition-engine` and `/api/nutrition-api`

Both prefixes mount the same protected nutrition API router.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/nutrition-engine/foods?search=oats` | Searches the external food catalogue |
| GET | `/api/nutrition-engine/nutrition?fdc_id=2346390` | Retrieves nutrition information for a food ID |
| POST | `/api/nutrition-engine/meal-summary` | Generates a meal summary from submitted food items |
| POST | `/api/nutrition-engine/nutrition-targets` | Calculates nutrition targets using profile data |
| GET | `/api/nutrition-api/foods?search=oats` | Alias of the food-search operation |
| GET | `/api/nutrition-api/nutrition?fdc_id=2346390` | Alias of the food-nutrition operation |
| POST | `/api/nutrition-api/meal-summary` | Alias of the meal-summary operation |
| POST | `/api/nutrition-api/nutrition-targets` | Alias of the nutrition-target operation |

The two prefixes are aliases for the same router operations. They are not recursive calls. Use one consistent prefix in new frontend code.

### Nutrition goals — `/api/nutrition-goals`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/nutrition-goals` | Retrieves the user's nutrition goals |
| PUT | `/api/nutrition-goals` | Creates or updates nutrition goals |
| GET | `/api/nutrition-goals/progress/today` | Calculates today's progress against nutrition goals |

Progress is calculated from recorded nutrition entries and configured goals.

### Local food catalogue — `/api/foods`

These routes are public at the router level.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/foods?search=oats&page=1&limit=20` | Public | Searches the local food catalogue with pagination |
| GET | `/api/foods/2346390` | Public | Retrieves a local food entry by food ID |

The controller uses a default page size of 20 and a maximum page size of 50.

### Dashboard — `/api/dashboard`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Protected | Aggregates relevant fitness records into a dashboard summary |

The dashboard summary is assembled from existing records; it is not necessarily stored as a separate database document.

### Insights — `/api/insights`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/insights` | Protected | Returns insights generated by the insights controller and service logic |

### Activity history — `/api/activity-history`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/activity-history?days=7` | Protected | Aggregates daily fitness and wellness activity |

The `days` query parameter accepts an integer from 1 through 90 and defaults to 7. Results are grouped by UTC date and include workout count and duration, wellness metrics, hydration amount, and nutrition totals.

### Injury risk — `/api/injury-risk`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/injury-risk/predict` | Protected | Sends validated user information to the injury-risk service and returns its prediction |

The prediction service accepts a recovery score as an input. A prediction is an estimate and is not a medical diagnosis.

### Coach–athlete management — `/api/coach-athletes`

All routes in this group are protected.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/coach-athletes/athletes/:athleteId/request` | Creates a coach's request to connect with an athlete |
| GET | `/api/coach-athletes/requests/incoming` | Lists incoming connection requests |
| PATCH | `/api/coach-athletes/requests/:assignmentId` | Responds to a connection request |
| GET | `/api/coach-athletes/athletes` | Retrieves athletes associated with the authenticated coach |
| GET | `/api/coach-athletes/coaches` | Retrieves coaches associated with the authenticated athlete |

Access to athlete information must be governed by role checks and the active coach–athlete relationship, not by a coach role alone.

## Nutrition API aliases

The application mounts the nutrition API router under both prefixes:

```js
app.use("/api/nutrition-api", nutritionApiRoutes);
app.use("/api/nutrition-engine", nutritionApiRoutes);
```

Both prefixes expose the same four operations. They provide alternate URLs for compatibility; they do not represent separate implementations.

## Image analysis

FitNect provides authenticated photo-based injury image analysis. The Node.js backend receives and validates the uploaded image, forwards it to the external CNN service, normalises the returned JSON, and responds to the client.

### Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/image-analysis/predict` | Protected | Uploads an image for analysis and returns the CNN/AI result |
| POST | `/api/injury-analysis/predict` | Protected | Alias for the image-analysis endpoint |

### Request

Send a `multipart/form-data` request to `/api/image-analysis/predict`.

| Form field | Type | Required | Accepted content |
|---|---|---|---|
| `image` | File | Yes | JPG, JPEG, or PNG image up to 8 MB |

Example browser request:

```js
const formData = new FormData();
formData.append("image", selectedFile);

const response = await fetch(
  "https://fitnect-api-1k4t.onrender.com/api/image-analysis/predict",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  }
);

const result = await response.json();

if (!response.ok) {
  throw new Error(result.message || "Image analysis failed");
}
```

When using `FormData`, allow the browser to set the multipart content type and boundary. Do not set `Content-Type: application/json` for this request.

### Backend validation

- A valid authenticated user is required.
- The upload field must be named `image`.
- JPG, JPEG, and PNG files are supported.
- The controller checks image content/signature rather than relying only on the filename.
- The maximum upload size is 8 MB.
- Missing, empty, unsupported, or invalid uploads are rejected before the upstream prediction request.

### External CNN service

The image-analysis service forwards the uploaded image as multipart field `image` to:

`https://fitnect-cnn-api.onrender.com/predict-image`

The upstream URL can be configured through `CNN_IMAGE_API_URL` when that setting is enabled in the service configuration.

The Node.js backend acts as the integration and proxy layer. The external ML service is responsible for image inference and explanation-provider logic; the Node.js backend does not itself run MobileNetV2, Gemini, or Groq.

### Response fields

The backend normalises the upstream response into these fields:

| Field | Type | Description |
|---|---|---|
| `success` | Boolean | Whether the analysis request succeeded |
| `prediction` | String | Predicted class, such as `Normal` or a supported injury/wound label |
| `confidence` | Number | Model confidence; not a medical severity score |
| `body_part` | String | Body part or region identified or validated by the ML service |
| `visible_description` | String | Description of visible image characteristics |
| `gemini_explanation` | String | Explanation text returned by the ML service; may contain Gemini, Groq, or fallback-generated text |
| `care_suggestions` | Array | Care suggestions returned by the ML service |
| `gemini_available` | Boolean | Whether Gemini was available, when reported by the ML service |
| `groq_available` | Boolean | Whether Groq was available, when reported by the ML service |
| `explanation_provider` | String | Provider or source used for the explanation |
| `validation_status` | String | Image/body-part validation status |
| `disclaimer` | String | Non-diagnostic disclaimer |

The `gemini_explanation` field name is retained for API compatibility even when the explanation comes from another provider or fallback path.

### Provider behaviour

Gemini is intended as the primary explanation provider and Groq as the fallback. Provider selection and inference happen in the external CNN service. The presence of provider fields in a response does not by itself prove that the live fallback path has been exercised successfully.

### Storage

The described image-analysis flow returns the prediction directly. It does not persist the uploaded image or prediction as an image-analysis MongoDB record, and it does not provide image-prediction history.

## Environment configuration

Configure the following variables in the local environment and in the Render service settings.

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port; the server defaults to `5000` |
| `HOST` | Bind address; the server defaults to `0.0.0.0` |
| `MONGODB_URI` or `MONGO_URI` | MongoDB connection string; configure the variable supported by the database connection code |
| `FRONTEND_URL` | Frontend origin used to construct password-reset links |
| `BREVO_API_KEY` | Brevo API key for email delivery |
| `BREVO_SENDER_EMAIL` | Sender email address used by the email service |
| `CNN_IMAGE_API_URL` | Optional override for the external CNN image-analysis service URL |

Google authentication and the external nutrition integration may require additional configuration values in their respective services. Keep those credentials in the deployment environment and out of source control.

Never commit `.env` files or publish database connection strings, JWT secrets, provider API keys, passwords, OTPs, or reset tokens.

## Run locally

### Requirements

- Node.js
- Access to a MongoDB database
- The environment variables required by the backend services

From the backend directory, install dependencies and start the server:

```bash
npm install
npm start
```

The server uses `PORT` when configured and otherwise listens on port `5000`.

The startup sequence loads environment variables, connects to MongoDB, checks the workout library, attempts to import initial workouts when the library is empty, and then starts the Express server. A failed database connection prevents normal startup.

## Data and date handling

Workout, nutrition, hydration, and wellness records are user-specific. Protected controllers use the authenticated user identity when reading and writing those records.

The activity-history controller:

- Defaults to a 7-day history when `days` is omitted.
- Accepts an integer from 1 through 90.
- Uses UTC day boundaries.
- Groups records by UTC date.
- Aggregates workout count and duration, wellness metrics, hydration amount, and nutrition totals.

The frontend should handle UTC dates consistently. When a record appears on an unexpected calendar day, compare the stored database date, API response date, and frontend date conversion/display logic.

## Error responses

The application returns a JSON 404 response for unknown routes and registers central error middleware after route registration.

Common HTTP status codes include:

| Status | Meaning |
|---|---|
| 200 | Request succeeded |
| 201 | Resource created |
| 400 | Invalid or missing input |
| 401 | Authentication is missing or invalid |
| 403 | The authenticated user is not permitted to perform the action |
| 404 | Route or resource not found |
| 409 | Conflict, such as a duplicate account where checked |
| 500 | Unexpected server error |

The exact status code and response body are determined by the route, controller, and middleware.

## Testing and verification

Run the test command defined by the backend's `package.json` from the backend directory. The test script and test-runner configuration are maintained with the backend source.

For endpoint verification, cover the following behaviours:

1. Confirm the route is mounted in `src/app.js`.
2. Confirm its controller and required model or service exist.
3. Send a valid request and inspect the returned JSON.
4. Send requests with missing and invalid fields.
5. Call protected endpoints without an access token and confirm access is rejected.
6. Confirm records are saved and retrieved for the authenticated user.
7. Confirm one user's token cannot access another user's private records.
8. Verify the frontend uses the correct method, path, authorization header, request fields, and response shape.
9. Check backend logs when MongoDB or an external provider fails.
10. Test external integrations independently when validating provider fallback behaviour.

A passing route-level test does not automatically establish that the production database, Render deployment, email provider, nutrition provider, or external CNN service is available.

## Integration notes

### Adding a recommended workout

`GET /api/fitness-recommendations/me` retrieves recommendations but does not save a workout. The frontend's Add action must call `POST /api/workouts` with the fields accepted by `createWorkout`, include the access token, handle errors, and refresh workout history after a successful response.

### Password-reset email

The reset flow depends on the reset controller, `FRONTEND_URL`, the email service, and Brevo configuration. Check backend and provider logs if a reset email is not received. A generic success response should not be treated as proof of delivery.

### Nutrition response structure

The nutrition engine proxies data from an external service and wraps the response. If the upstream response already contains a `data` property, the resulting response may be nested. The frontend must follow the actual JSON structure returned by the endpoint.

### Injury-risk prediction

The injury-risk route delegates to `injuryRiskService.js`. The presence of a prediction endpoint does not establish a particular model, model accuracy, or persisted prediction history. Treat prediction results as estimates rather than diagnoses.

### Image-analysis timeouts

The image-analysis flow has several independent timeout layers:

1. Frontend/browser request timeout.
2. Node.js request handling and Node-to-CNN upstream timeout.
3. ML inference and Gemini/Groq provider timeouts.
4. Hosting-platform or proxy request limits.

Changing one timeout does not change the others. The active values are controlled by the image-analysis service and controller configuration, including `CNN_REQUEST_TIMEOUT_MS` where configured.

### Troubleshooting image analysis

| Symptom | What to check |
|---|---|
| 400 response | The multipart field is named `image`, the file is not empty, and the image is a supported format |
| 401 response | The request includes a valid access token |
| Upload rejected for size | The image is no larger than 8 MB |
| 503 or upstream error | Check the CNN service URL, Render service status, and backend logs |
| Browser request times out | Compare the frontend timeout with backend and ML processing timeouts |
| Prediction has no explanation | Check Gemini/Groq configuration and external ML service logs |
| Gemini fails without Groq fallback | Verify and test the fallback implementation directly in the external ML service |

## Medical disclaimer

FitNect's injury-risk predictions and image-analysis outputs are informational estimates. They are not medical diagnoses and must not replace assessment by a qualified healthcare professional. Seek professional care for severe, worsening, or uncertain symptoms.
