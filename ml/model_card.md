\# Athlete Severe Injury Risk Prediction Model



\## 1. Project Overview



This machine learning model estimates the probability of severe injury risk for an athlete using current-session data.



The model is intended to support athlete monitoring and injury-prevention workflows. It is not a medical diagnosis tool.



\## 2. Model Artifact



\- Artifact filename: `severe\_injury\_model.joblib`

\- Model type: Ensemble of Logistic Regression and HistGradientBoostingClassifier

\- Framework: scikit-learn

\- Prediction type: Binary classification

\- Target column: `injury\_occurred`

\- Positive class: `injury\_occurred == 2` (severe injury)

\- Negative class: All other target values

\- Alert threshold: `0.5`



The final probability is calculated as the average of the Logistic Regression and HistGradientBoosting predicted probabilities.



\## 3. Required Input Features



The API requires the following 14 fields:



1\. `heart\_rate` — number

2\. `stress\_level` — number

3\. `hydration\_level` — number

4\. `sleep\_quality` — number

5\. `recovery\_score` — number

6\. `step\_count` — number

7\. `training\_load` — number

8\. `training\_intensity` — number

9\. `training\_duration` — number

10\. `fatigue\_index` — number

11\. `sport\_type` — string

12\. `gender` — string

13\. `age` — number

14\. `bmi` — number



\## 4. Optional Input Features



The API accepts these five optional fields:



1\. `cadence` — number

2\. `jump\_height` — number

3\. `playing\_surface` — numeric encoding, if consistent with training data

4\. `body\_temperature` — number

5\. `gait\_speed` — number



Missing optional values are represented as missing values during preprocessing. The deployed preprocessing must match the training process.



\## 5. Preprocessing Requirements



\- Map `sport\_type` using the same mapping used during model training:

&#x20; - Basketball = 0

&#x20; - Other = 1

&#x20; - Soccer = 2

&#x20; - Track = 3

\- Derive `male` from `gender`:

&#x20; - Male = 1

&#x20; - Female = 0

\- Preserve the exact feature names and order stored in the model artifact.

\- Logistic Regression uses median imputation and standard scaling through its saved pipeline.

\- HistGradientBoosting handles missing numerical values using its trained model behavior.

\- Confirm that `playing\_surface` is encoded exactly as it was during training.

\- Do not add historical features or fields that the model was not trained to use.



\## 6. Prediction Output



The prediction endpoint returns:



\- `prediction` — predicted alert status as text

\- `severe\_risk\_probability` — probability between 0 and 1

\- `severe\_risk\_percent` — probability expressed as a percentage

\- `risk\_level` — Low, Medium or High

\- `alert` — 1 when probability is at least 0.5; otherwise 0

\- `threshold` — alert threshold

\- `history\_available` — false for this current-session-only model



Risk level rules:



\- Low: probability below 0.40

\- Medium: probability from 0.40 to below 0.70

\- High: probability of 0.70 or above



These risk categories are API thresholds and should not be interpreted as clinically validated risk categories.



\## 7. API Endpoints



\- `GET /` — health check and API information

\- `POST /predict` — predict severe injury risk from a JSON request



\## 8. Dependencies



\- Flask

\- pandas

\- NumPy

\- scikit-learn

\- joblib



Install dependencies using:



`py -m pip install -r flask/requirements.txt`



\## 9. Limitations



\- Predictions depend on the quality and representativeness of the training data.

\- The model estimates risk and does not establish the cause of an injury.

\- The alert threshold is a model configuration, not a clinically validated medical threshold.

\- Validate predictions and preprocessing before production deployment.

\- Confirm the model's evaluation metrics using the final athlete-wise held-out test set before reporting performance.



\## 10. Deployment Files



\- `severe\_injury\_model.joblib`

\- `flask/app.py`

\- `flask/requirements.txt`

\- `model\_card.md`  



\## 11. Model Explainability (SHAP)



SHAP (SHapley Additive exPlanations) is used to explain the features influencing the athlete severe injury risk prediction.



\### Purpose

\- Identify which input features influence severe injury risk predictions.

\- Provide global feature importance across multiple athlete sessions.

\- Explain individual predictions by showing which features push the predicted probability higher or lower.



\### Model

The prediction model combines:

\- Logistic Regression

\- HistGradientBoostingClassifier



The SHAP explanation is calculated for the ensemble severe-injury probability, which is the average probability from both models.



\### Explainability Outputs

\- `shap\_feature\_importance.csv` — mean absolute SHAP values for each feature.

\- `shap\_feature\_importance.png` — global feature importance plot.

\- SHAP summary plot — shows feature contribution patterns across explained samples.

\- SHAP waterfall plot — explains an individual prediction.



\### Interpretation

\- Positive SHAP values push the prediction toward a higher severe-injury probability.

\- Negative SHAP values push the prediction toward a lower severe-injury probability.

\- Mean absolute SHAP values summarize the average magnitude of feature contributions.



\### Important Limitations

\- SHAP explains model behavior; it does not establish medical causation.

\- Explanations depend on the input data and the preprocessing used.

\- SHAP values should not be interpreted as medical diagnoses or guaranteed injury causes.

\- Explainability outputs should be regenerated if the model or preprocessing changes.



\### Files

\- `shap\_explainability.ipynb`

\- `shap\_feature\_importance.csv`

\- `shap\_feature\_importance.png`



