# FitNect Backend API

## 1. Project Overview
FitNect is a fitness and wellness application designed to help individuals track workouts, recovery, hydration, nutrition, and activity history. It also supports coach–athlete relationships and is being prepared for future machine-learning integration. The backend provides REST APIs, manages user authentication, stores application data in MongoDB, and calculates summaries for the frontend.

### Technology Stack
* **Node.js:** JavaScript runtime.
* **Express.js:** HTTP server, routing, and middleware.
* **MongoDB:** Database.
* **Mongoose:** MongoDB object-document mapping and schema validation.
* **JWT:** Authentication tokens.
* **bcryptjs:** Password hashing and comparison.
* **Email OTP:** Email verification.
* **Google authentication:** Sign-in using Google credentials. 

*Confirm the exact installed packages and versions in `package.json`.*

## 2. Base URL
* **Deployed API:** `https://fitnect-api-1k4t.onrender.com`
* **Local API:** `http://localhost:3000` *(confirm the port configured in your environment)*

All endpoints below are relative to the selected base URL.

### Authentication Header
Protected endpoints require a valid access token:
```http
Authorization: Bearer <access_token>
```

JSON requests should normally include:
```http
Content-Type: application/json
```

## 3. API Endpoints

### A. Authentication

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/verify-email` | Verify email using OTP |
| POST | `/api/auth/resend-otp` | Request another verification OTP |
| POST | `/api/auth/login` | Log in using credentials |
| POST | `/api/auth/google` | Sign in using Google authentication |
| PATCH | `/api/auth/change-password` | Change password while logged in |
| POST | `/api/auth/forgot-password` | Request a password-reset email |
| POST | `/api/auth/reset-password` | Set a new password |


### B. User Profile

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/users/me` | Retrieve the authenticated user's profile |
| PATCH | `/api/users/me` | Updates the authenticated user's editable profile fields |

| PATCH | `/api/users/me` | Update the authenticated user's name and avatar |

**Profile updates:** The endpoint accepts `name` and `avatar` as optional fields. At least one must be supplied. Name must contain 2–60 characters after trimming. Avatar must be a string of at most 2048 characters. Email, role, password, and email-verification status cannot be changed through this endpoint. The authenticated user's identity is obtained from the JWT.



### C. Workout Tracking

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/workouts` | Create a workout log |
| GET | `/api/workouts` | List the user's workout logs |
| GET | `/api/workouts/stats?period=week` | Retrieve workout statistics, if installed |
| GET | `/api/workouts/:id` | Retrieve one workout |
| PATCH | `/api/workouts/:id` | Update a workout |
| DELETE | `/api/workouts/:id` | Delete a workout |

*Workout logs represent sessions completed by a user. Private workout operations should verify that the record belongs to the authenticated user.*

### D. Workout Library

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/workout-library` | Browse predefined exercises |
| GET | `/api/workout-library/:id` | Retrieve exercise details |

*Library entries may contain descriptions, instructions, difficulty, equipment, target muscles, and image/video URLs. The library needs seed data before it can return exercise entries.*

### E. Wellness

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/wellness` | Save a wellness check-in |
| GET | `/api/wellness/today` | Retrieve today's check-in |
| GET | `/api/wellness/history` | Retrieve past check-ins |

### F. Recovery

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/recovery` | Save or update a recovery check-in |
| GET | `/api/recovery/today` | Retrieve today's recovery record |
| GET | `/api/recovery/history?limit=30` | Retrieve recovery history |

*The drafted recovery feature reuses wellness check-in data. Confirm the current model and controller before assuming that both features share the same record.*

### G. Hydration

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/hydration` | Record a hydration entry |
| GET | `/api/hydration/today` | Retrieve today's intake |
| GET | `/api/hydration/history?days=7` | Retrieve hydration history |

#### Example Request
```json
{
  "date": "2026-10-19",
  "amountMl": 300,
  "beverageType": "water",
  "notes": "Water after workout"
}
```

### H. Nutrition

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/nutrition` | Record a food or meal entry |
| GET | `/api/nutrition/today` | Retrieve today's nutrition entries |
| GET | `/api/nutrition/history?days=7` | Retrieve nutrition history |

*Nutrition records are manually entered in the planned implementation. The API does not automatically recognize foods or verify their nutritional values.*

### I. Nutrition Goals

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/nutrition-goals` | Retrieve configured nutrition goals |
| PUT | `/api/nutrition-goals` | Create or update nutrition goals |
| GET | `/api/nutrition-goals/progress/today` | Compare today's intake with goals |

*Goals may include daily calories, protein, carbohydrates, and fat. Progress calculations depend on the recorded nutrition entries and configured goals.*

### J. Dashboard, Insights, and Activity History

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/dashboard/summary` | Retrieve a combined dashboard summary |
| GET | `/api/insights` | Retrieve rule-based wellness insights |
| GET | `/api/activity-history?days=7` | Retrieve daily activity trends |

*Rule-based insights are generated from predefined conditions. They should not be described as machine-learning predictions.*

### K. Coach–Athlete Management

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/coach-athletes/athletes/:athleteId/request` | Coach requests access to an athlete |
| GET | `/api/coach-athletes/requests/incoming` | Athlete views pending requests |
| PATCH | `/api/coach-athletes/requests/:assignmentId` | Athlete accepts or rejects a request |
| GET | `/api/coach-athletes/athletes` | Coach lists assigned athletes |
| GET | `/api/coach-athletes/coaches` | Athlete lists active coaches |

*Only active coach–athlete relationships should grant access to an athlete's private data. A coach role by itself must not grant access to every athlete.*

## 4. Common HTTP Status Codes

| Status | Meaning |
| :--- | :--- |
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid or missing input |
| 401 | Authentication missing or invalid |
| 403 | User lacks permission |
| 404 | Resource not found |
| 409 | Conflicting or duplicate operation |
| 500 | Unexpected server error |

*The exact status codes depend on the controller implementation.*

## 5. Local Setup
From the backend directory, run:
```bash
npm install
npm start
```
Configure required environment variables in a local `.env` file and in the deployment environment. Never commit database credentials, JWT secrets, email credentials, or other secrets to Git.

## 6. Verification Checklist
Before treating an endpoint as complete:
1. Confirm its model, controller, and route files exist.
2. Confirm its router is mounted in `src/app.js`.
3. Test valid and invalid requests.
4. Test protected endpoints without a token.
5. Verify that users cannot access one another's private records.
6. Test coach permissions and athlete consent.
7. Check server logs and the deployed commit.
8. Confirm that the frontend uses the actual response structure.

## 7. Machine-Learning Integration
The ML prediction endpoint is not defined yet. Before implementing it, obtain the trained model artifact, input feature names and units, preprocessing pipeline, missing-data rules, output contract, runtime requirements, and sample input/output pairs from the ML team. 

The backend can then validate input, prepare the required features, run model inference, optionally store prediction history, and return a documented JSON response.

***

**Implementation note:** This README is based on the current development plan. Verify every listed endpoint against the repository and deployment before treating it as a definitive list of live APIs.
