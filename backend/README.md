FitNect Backend API
FitNect is a fitness and wellness application for tracking workouts, wellness check-ins, recovery-related information, hydration, nutrition, and activity history. The backend also provides fitness recommendations, workout-library access, coach–athlete relationship management, and an injury-risk prediction endpoint.

This README documents the backend structure and routes shown in the supplied Project Structure(7).docx source. It is intended as the project README and an integration reference. Verify deployed behaviour against the current repository and hosting environment before treating any endpoint as live-tested.
Contents
- Overview
- Technology and dependencies
- Project structure
- Base URLs
- Authentication
- API reference
- Nutrition route aliases
- Error handling and status codes
- Environment configuration
- Run locally
- Data and date handling
- Known integration notes
- Testing checklist
- Machine-learning integration
Overview
The backend is a REST API built with Express. It accepts JSON requests from the frontend, authenticates users where required, validates request data, reads and writes MongoDB documents through Mongoose, and returns JSON responses.
Main responsibilities
- Account registration, email OTP verification, login, Google login, and password reset.
- User profile and fitness profile management.
- Personal workout logging, workout statistics, and workout-library browsing.
- Wellness, recovery-related check-ins, and hydration logging.
- Nutrition diary, nutrition goals, food catalogue search, and nutrition-service integration.
- Dashboard summary, insights, and activity-history aggregation.
- Coach–athlete requests and relationship management.
- An injury-risk prediction endpoint.
Technology and dependencies
The supplied source demonstrates use of the following technologies and packages. The actual installed versions must be confirmed in package.json and the lockfile.
Technology/package	Role
Node.js	JavaScript runtime for the backend
Express	HTTP server, route registration, and middleware
Mongoose	MongoDB connection, models, queries, and aggregation
MongoDB	Persistent application data
dotenv	Loads environment variables from .env during local development
cors	Configures cross-origin browser requests
helmet	Adds HTTP security-related headers
JWT/token service	Supports authenticated requests; token implementation is in services/tokenService.js
bcryptjs	Listed in the project’s intended stack for password hashing/comparison; confirm its use and version in the current source and package.json
crypto (Node.js built-in)	Used by the authentication controller for cryptographic token operations
Brevo email API	Email sending through the project’s email service, according to the supplied implementation
External nutrition service	Food search and nutrition data through services/nutritionApiService.js


Do not add package versions to this README until they have been checked against package.json.
Project structure
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
Request flow
A typical protected request follows this flow:
1. The frontend sends an HTTP request to a route.
2. app.js directs the request to the relevant router.
3. authMiddleware.js verifies the token when the route uses protect.
4. The route calls a controller function.
5. The controller validates input and uses a model or service.
6. Mongoose reads or writes MongoDB, or a service calls an external provider.
7. The controller returns a JSON response.
8. Errors may be passed to the central error handler.
Route defines the HTTP method and URL. Controller implements request handling. Model describes database documents. Service contains reusable operations or integrations. Middleware runs before or around a route handler.
Base URLs
Environment	Base URL
Deployed backend	https://fitnect-api-1k4t.onrender.com
Local development	http://localhost:5000


The local port is based on the supplied server.js, which uses process.env.PORT or falls back to 5000. The deployed URL was supplied in the project draft; confirm it is still the active Render service.

The health-check endpoint is:
GET /api/health
Example full URL:
https://fitnect-api-1k4t.onrender.com/api/health
All paths below are relative to the selected base URL.
Authentication
Protected endpoints use the protect middleware and normally require an access token in the request header:
Authorization: Bearer <access_token>
Content-Type: application/json
Do not send a token placeholder literally; replace it with the token returned by the login flow.

The authentication routes in the supplied source are:
Method	Endpoint	Access	Controller/function	Purpose
POST	/api/auth/register	Public	register	Validates registration data, creates or updates an unverified account, and initiates email verification according to the controller logic.
POST	/api/auth/verify-email	Public	verifyEmail	Verifies an account using the submitted OTP.
POST	/api/auth/resend-otp	Public	resendOTP	Requests another verification OTP.
POST	/api/auth/login	Public	login	Validates credentials and returns authentication information.
POST	/api/auth/google	Public	googleLogin in googleAuthController.js	Handles Google sign-in credentials.
PATCH	/api/auth/change-password	Protected	changePassword	Changes the password for the authenticated user after the controller’s checks.
POST	/api/auth/forgot-password	Public	forgotPassword	Initiates password reset and requests a reset email.
POST	/api/auth/reset-password	Public	resetPassword	Validates a reset token and updates the password.


Password reset notes
The supplied controller uses the email service and FRONTEND_URL to construct a reset link. Verify these deployed environment variables and provider settings if reset emails are not received. A generic success response does not necessarily prove that the email provider delivered a message; check backend logs and the email provider’s logs.

Never publish reset tokens, passwords, JWT secrets, or provider API keys.
API reference
The tables below reflect the route declarations shown in the supplied source document. “Protected” means the route applies the protect middleware in that source. The response fields and detailed validation rules should be confirmed in the corresponding controller and model.
Root and health
Method	Endpoint	Access	Function	Purpose
GET	/	Public	Inline handler in app.js	Returns service status information.
GET	/api/health	Public	Inline handler in app.js	Returns a basic backend health response.


A successful health check confirms that the server responds; it does not guarantee that MongoDB or every external service is functioning.
User profile — /api/users
Method	Endpoint	Access	Function	Purpose
GET	/api/users/me	Protected	getMyProfile	Retrieves the authenticated user's profile.
PATCH	/api/users/me	Protected	updateMyProfile	Updates permitted fields on the authenticated user's profile.


The user identity should come from the verified authentication context, not an arbitrary user ID submitted by the client. The supplied controller should be treated as the authority for allowed fields and validation rules.
Fitness profile — /api/fitness-profile
Method	Endpoint	Access	Function	Purpose
GET	/api/fitness-profile/me	Protected	getMyFitnessProfile	Retrieves the current user's fitness profile.
PUT	/api/fitness-profile/me	Protected	saveMyFitnessProfile	Creates or updates the current user's fitness profile.


The profile can provide inputs for personalised fitness and nutrition calculations. Use the model/controller for the exact supported fields.
Fitness recommendations — /api/fitness-recommendations
Method	Endpoint	Access	Function	Purpose
GET	/api/fitness-recommendations/me	Protected	getMyFitnessRecommendations	Calls fitnessRecommendationService for recommendations for the authenticated user and returns them in a JSON response.


This endpoint retrieves recommendations; it does not itself create a workout log. To save a recommendation to workout history, the frontend must call POST /api/workouts with the workout fields required by that controller.
Workout logs — /api/workouts
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
POST	/api/workouts	Protected	createWorkout	Validates and creates a workout log for the authenticated user.
GET	/api/workouts	Protected	getWorkouts	Lists workout logs for the authenticated user.
GET	/api/workouts/stats	Protected	getWorkoutStats	Returns workout statistics.
GET	/api/workouts/:id	Protected	getWorkoutById	Retrieves a workout by ID, subject to controller checks.
PATCH	/api/workouts/:id	Protected	updateWorkout	Updates a workout by ID, subject to controller checks.
DELETE	/api/workouts/:id	Protected	deleteWorkout	Deletes a workout by ID, subject to controller checks.


Example create-workout body, based on the fields identified in the supplied controller:
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
Use only category values accepted by the actual model/controller. Include a date only in the format supported by the application.
Workout library — /api/workout-library
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
GET	/api/workout-library	Protected	getWorkoutLibrary	Lists available predefined workouts/exercises from the library.
GET	/api/workout-library/:id	Protected	getWorkoutDetails	Retrieves details for one library item.


server.js checks whether the workout library is empty and attempts to import initial exercises at startup. The import can fail independently, so check server logs if the library returns no items.
Wellness — /api/wellness
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
POST	/api/wellness	Protected	saveWellness	Saves a wellness check-in.
GET	/api/wellness/today	Protected	getTodayWellness	Retrieves today's wellness information.
GET	/api/wellness/history	Protected	getWellnessHistory	Retrieves previous wellness check-ins.


Recovery — /api/recovery
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
POST	/api/recovery	Protected	saveRecovery	Saves or updates recovery-related information according to the controller.
GET	/api/recovery/today	Protected	getTodayRecovery	Retrieves today's recovery-related information.
GET	/api/recovery/history	Protected	getRecoveryHistory	Retrieves recovery history.


The supplied implementation relates recovery information to wellness check-ins. Do not assume it maintains a separate machine-learning recovery-score history unless such persistence is implemented.
Hydration — /api/hydration
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
POST	/api/hydration	Protected	addHydration	Saves a hydration entry.
GET	/api/hydration/today	Protected	getTodayHydration	Retrieves today's hydration information.
GET	/api/hydration/history	Protected	getHydrationHistory	Retrieves hydration history.


Check the controller/model for the exact units and accepted fields. The amountMl field is used by the activity-history aggregation.
Nutrition diary — /api/nutrition
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
POST	/api/nutrition	Protected	addNutrition	Creates a nutrition diary entry.
POST	/api/nutrition/from-catalogue	Protected	addFoodFromCatalogue	Creates a diary entry using catalogue food information.
GET	/api/nutrition/today	Protected	getTodayNutrition	Retrieves today's nutrition entries/summary as implemented by the controller.
GET	/api/nutrition/history	Protected	getNutritionHistory	Retrieves nutrition history.


Searching for a food is not the same as logging it. The frontend must call a diary creation endpoint after the user chooses a food.
Nutrition service proxy — /api/nutrition-engine and /api/nutrition-api
Both prefixes mount the same nutritionApiRoutes router in app.js. They expose the same four operations under two different URL prefixes.

All routes are protected.
Method	Endpoint	Access	Function	Purpose
GET	/api/nutrition-engine/foods?search=<term>	Protected	searchFoods	Searches the external food catalogue through nutritionApiService.
GET	/api/nutrition-engine/nutrition?fdc_id=<id>	Protected	getFoodNutrition	Retrieves nutrition information for a numeric food ID.
POST	/api/nutrition-engine/meal-summary	Protected	getMealSummary	Processes submitted food items to provide a meal summary.
POST	/api/nutrition-engine/nutrition-targets	Protected	getNutritionTargets	Calculates or retrieves nutrition targets using profile data and the nutrition service logic.
GET	/api/nutrition-api/foods?search=<term>	Protected	searchFoods	Alias of the food-search operation above.
GET	/api/nutrition-api/nutrition?fdc_id=<id>	Protected	getFoodNutrition	Alias of the food-nutrition operation above.
POST	/api/nutrition-api/meal-summary	Protected	getMealSummary	Alias of the meal-summary operation above.
POST	/api/nutrition-api/nutrition-targets	Protected	getNutritionTargets	Alias of the nutrition-target operation above.


The two prefixes are route aliases, not recursive calls. They do create duplicate public URLs for the same router operations. The frontend should consistently use one prefix unless compatibility with the other is required.
Nutrition goals — /api/nutrition-goals
All routes in this router are protected.
Method	Endpoint	Access	Function	Purpose
GET	/api/nutrition-goals	Protected	getGoals	Retrieves the user's nutrition goals.
PUT	/api/nutrition-goals	Protected	saveGoals	Creates or updates nutrition goals.
GET	/api/nutrition-goals/progress/today	Protected	getTodayProgress	Calculates today's progress against nutrition goals.


Progress depends on the user's recorded nutrition entries and configured goals. The exact fields and formulas are defined by the goal controller/model.
Local food catalogue — /api/foods
The supplied foodRoutes.js does not attach the protect middleware. These two routes are therefore public at the router level in the supplied source.
Method	Endpoint	Access	Function	Purpose
GET	/api/foods?search=<term>&page=1&limit=20	Public	searchFoods	Searches the local Food catalogue with pagination. The controller validates pagination and search input.
GET	/api/foods/:fdcId	Public	getFoodById	Retrieves a local food entry using its food ID.


The controller comments identify a default page size of 20 and a maximum page size of 50. Verify the current controller for all validation rules.
Dashboard — /api/dashboard
Method	Endpoint	Access	Function	Purpose
GET	/api/dashboard/summary	Protected	getDashboardSummary	Combines relevant fitness records into a dashboard summary.


A dashboard summary is an aggregation of existing records; it is not necessarily a separately stored record. The supplied activity/recovery logic should not be described as a machine-learning score unless a model is actually called.
Insights — /api/insights
Method	Endpoint	Access	Function	Purpose
GET	/api/insights	Protected	getInsights	Returns insights based on the controller/service logic.


Check insightsController.js before describing the output as AI-generated. Rule-based calculations and machine-learning predictions are different implementations.
Activity history — /api/activity-history
Method	Endpoint	Access	Function	Purpose
GET	/api/activity-history?days=7	Protected	getActivityHistory	Aggregates daily workout, wellness/recovery, hydration, and nutrition values for a requested date range.


The supplied controller accepts a days query parameter that must be an integer from 1 through 90. It groups data by UTC date and returns a daily history array. This UTC grouping is relevant when investigating differences between dates displayed by the frontend and dates stored by the backend.
Injury risk — /api/injury-risk
Method	Endpoint	Access	Function	Purpose
POST	/api/injury-risk/predict	Protected	predictMyInjuryRisk	Passes validated user information to the injury-risk service and returns its result.


The supplied code accepts a recovery score as an input to injury-risk prediction. That alone does not prove the backend generates or persists recovery-score history. A prediction is not a medical diagnosis.
Coach–athlete management — /api/coach-athletes
All routes in this router are protected. Role and relationship checks should be enforced by the controller.
Method	Endpoint	Access	Function	Purpose
POST	/api/coach-athletes/athletes/:athleteId/request	Protected	requestAthlete	Creates a coach's request to connect with an athlete.
GET	/api/coach-athletes/requests/incoming	Protected	getIncomingRequests	Lists incoming coach–athlete requests for the authenticated user.
PATCH	/api/coach-athletes/requests/:assignmentId	Protected	respondToRequest	Handles a response to a connection request.
GET	/api/coach-athletes/athletes	Protected	getAssignedAthletes	Retrieves athletes associated with the authenticated coach, subject to controller checks.
GET	/api/coach-athletes/coaches	Protected	getMyCoaches	Retrieves coaches associated with the authenticated athlete, subject to controller checks.


A coach role should not by itself grant access to every athlete's private information. The active relationship and authorization logic must be checked before exposing records.
Nutrition route aliases
The source mounts nutritionApiRoutes twice:
app.use("/api/nutrition-api", nutritionApiRoutes);
app.use("/api/nutrition-engine", nutritionApiRoutes);
This means the same router handlers are available through both prefixes. It is not recursion, but it can make API documentation confusing and can lead to inconsistent frontend usage. For new frontend code, choose one canonical prefix and use it consistently.
Error handling and status codes
app.js returns a JSON 404 response for an unknown route and registers a central error handler after the routes.

Common HTTP status codes:
Status	Meaning
200	Request succeeded
201	Resource created
400	Invalid or missing input
401	Authentication missing or invalid
403	Authenticated user is not permitted to perform the action
404	Route or resource not found
409	Conflict, such as a duplicate account where checked
500	Unexpected server error


The exact status code for each error is controlled by its route/controller and middleware. Do not assume all endpoints use every status code above.
Environment configuration
The supplied source confirms these environment-variable names:
Variable	Purpose
PORT	Server port; defaults to 5000 in the supplied server.js
HOST	Bind host; defaults to 0.0.0.0
MONGODB_URI or MONGO_URI	MongoDB connection string; at least one must be configured
FRONTEND_URL	Used to construct frontend password-reset links
BREVO_API_KEY	API key for the Brevo email service, as required by the supplied email-service integration
BREVO_SENDER_EMAIL	Sender email used by the email service


Other variables may be required by Google authentication, the external nutrition service, or other service implementations. Check googleAuthController.js, nutritionApiService.js, emailService.js, and the deployment configuration for the complete list. Do not guess environment-variable names.

Keep .env out of version control. Never put real credentials in README examples, commits, issues, or screenshots.
Run locally
Prerequisites:
- A supported Node.js installation.
- Access to a MongoDB database.
- The required environment variables configured.
From the backend directory:
npm install
npm start
The supplied server.js uses PORT or defaults to 5000. Confirm that package.json defines the start script before running these commands; if it does not, use the script actually defined there.

The startup sequence:
1. Loads environment variables.
2. Connects to MongoDB.
3. Checks whether the workout library contains entries.
4. Attempts to import initial workouts if the library is empty.
5. Starts the Express server.
If the database connection fails, the server logs the failure and does not proceed with normal startup.
Data and date handling
Workout, nutrition, hydration, and wellness records are user-specific. Protected controllers should use the authenticated user identity when querying and saving records.

The supplied activityHistoryController.js:
- Defaults to a 7-day history when days is not provided.
- Accepts an integer days value from 1 to 90.
- Uses UTC day boundaries.
- Groups records into UTC dates.
- Aggregates workout count and duration, wellness metrics, hydration amount, and nutrition totals.
Because the backend uses UTC grouping, the frontend should not mix UTC dates and local calendar dates without an explicit conversion strategy. When a workout from yesterday appears under today's date, compare the stored database date, the API response date, and the frontend's date filtering/display logic.
Known integration notes
Adding a recommended workout
GET /api/fitness-recommendations/me retrieves suggestions; it does not save a workout. The frontend's Add action must send POST /api/workouts with the fields required by createWorkout, include the access token, handle errors, and refresh workout history after a successful response.
Forgot-password email
The reset flow depends on the reset controller, FRONTEND_URL, the email service, and email-provider configuration. Inspect backend and provider logs if an email is not received. A generic frontend success message should not be treated as proof of delivery.
Nested nutrition data
The nutrition engine proxies data from an external service and wraps it in a response object. If the upstream response already has its own data property, the result may appear deeply nested. The frontend must follow the actual JSON response structure. Avoid adding unnecessary wrappers, and standardise response formats where possible.
ML functionality
An endpoint named predict does not by itself prove that a trained ML model is integrated. Verify injuryRiskService.js and the model/runtime it invokes. Likewise, the recovery routes shown in the source are recovery-related data routes; they do not establish a separate persisted ML recovery-score history.
Testing checklist
Before considering an endpoint integrated:
1. Confirm its route exists and is mounted in src/app.js.
2. Confirm the controller function and model/service exist.
3. Test a valid request.
4. Test missing and invalid fields.
5. Test protected routes without a token.
6. Confirm the request is saved or retrieved from the correct user's records.
7. Confirm one user's token cannot access another user's private data.
8. Check the exact JSON response in the browser Network tab or an API client.
9. Check server logs when external services fail.
10. Verify the frontend uses the correct HTTP method, URL, token, request fields, and response shape.
Machine-learning integration
The supplied source contains an injury-risk prediction route and service, but this README does not assume a specific trained model or accuracy. Before adding or documenting an ML model, establish:
- The model artifact and runtime.
- Required feature names, units, and types.
- Preprocessing and missing-value rules.
- Expected output schema.
- Sample inputs and outputs.
- Error behaviour and versioning.
- Whether predictions are stored and how a user retrieves their history.
The API should validate inputs, run the agreed inference process, and return a documented response. Prediction results should be presented as estimates, not medical diagnoses.
Route-count note
The supplied source declares 53 route handlers when counting the root and health routes and each router's declarations once. The nutrition API router is mounted under two prefixes, adding four alternate full paths. This gives 57 reachable method/path combinations in the source configuration if both aliases are counted separately. This is a source-derived route count, not a live deployment test.
Implementation status
This README describes the code visible in the supplied project structure document. It does not claim that every route has been tested against the deployed server. Before release, compare this file with the current repository, package.json, environment configuration, and live API responses.