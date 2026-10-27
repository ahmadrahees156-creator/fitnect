import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class InjuryRiskScreen extends StatefulWidget {
  final String token; 

  const InjuryRiskScreen({
    super.key,
    required this.token,
  });

  @override
  State<InjuryRiskScreen> createState() => _InjuryRiskScreenState();
}

class _InjuryRiskScreenState extends State<InjuryRiskScreen> {
  final _formKey = GlobalKey<FormState>();

  
  final TextEditingController _heartRateController = TextEditingController();
  final TextEditingController _stressController = TextEditingController();
  final TextEditingController _hydrationController = TextEditingController();
  final TextEditingController _sleepQualityController = TextEditingController();
  final TextEditingController _recoveryScoreController = TextEditingController();
  final TextEditingController _stepCountController = TextEditingController();
  final TextEditingController _trainingLoadController = TextEditingController();
  final TextEditingController _trainingIntensityController = TextEditingController();
  final TextEditingController _trainingDurationController = TextEditingController();
  final TextEditingController _fatigueIndexController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _bmiController = TextEditingController();

  
  String _selectedSport = 'Other';
  String _selectedGender = 'Male';

  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _predictionResult;

  @override
  void dispose() {
    _heartRateController.dispose();
    _stressController.dispose();
    _hydrationController.dispose();
    _sleepQualityController.dispose();
    _recoveryScoreController.dispose();
    _stepCountController.dispose();
    _trainingLoadController.dispose();
    _trainingIntensityController.dispose();
    _trainingDurationController.dispose();
    _fatigueIndexController.dispose();
    _ageController.dispose();
    _bmiController.dispose();
    super.dispose();
  }

  Future<void> _submitPrediction() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _predictionResult = null;
    });

    final url = Uri.parse('https://fitnect-api-1k4t.onrender.com/api/injury-risk/predict');

    try {
      final bodyData = {
        "heart_rate": double.parse(_heartRateController.text),
        "stress_level": double.parse(_stressController.text),
        "hydration_level": double.parse(_hydrationController.text),
        "sleep_quality": double.parse(_sleepQualityController.text),
        "recovery_score": double.parse(_recoveryScoreController.text),
        "step_count": double.parse(_stepCountController.text),
        "training_load": double.parse(_trainingLoadController.text),
        "training_intensity": double.parse(_trainingIntensityController.text),
        "training_duration": double.parse(_trainingDurationController.text),
        "fatigue_index": double.parse(_fatigueIndexController.text),
        "sport_type": _selectedSport,
        "gender": _selectedGender,
        "age": double.parse(_ageController.text),
        "bmi": double.parse(_bmiController.text),
      };

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: jsonEncode(bodyData),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _predictionResult = data;
        });
      } else if (response.statusCode == 400) {
        setState(() {
          _errorMessage = 'Invalid or missing request fields (400). Please check your input parameters.';
        });
      } else if (response.statusCode == 401) {
        setState(() {
          _errorMessage = 'Authentication error (401). Missing or invalid Bearer token.';
        });
      } else if (response.statusCode == 502 || response.statusCode == 503) {
        setState(() {
          _errorMessage = 'ML service failure or unavailability (${response.statusCode}). Please try again later.';
        });
      } else {
        setState(() {
          _errorMessage = 'Unexpected server error occurred (${response.statusCode}).';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network connection error: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFFF7F5FA);
    const primaryPurple = Color(0xFF8E24AA);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Injury Risk Analysis', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('PREVENTATIVE MONITORING', style: TextStyle(color: primaryPurple, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 4),
              const Text('Assess Risk Metrics', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.black)),
              const SizedBox(height: 6),
              const Text('Enter your telemetry and training metrics to evaluate your current injury risk profile.', style: TextStyle(fontSize: 13, color: Colors.black54)),
              const SizedBox(height: 20),

              
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.redAccent),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent),
                      const SizedBox(width: 12),
                      Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500))),
                    ],
                  ),
                ),

              
              if (_predictionResult != null)
                Container(
                  padding: const EdgeInsets.all(20),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8DEF8),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: primaryPurple, width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('EVALUATION RESULT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: primaryPurple, letterSpacing: 1)),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Risk Level: ${_predictionResult!['risk_level'] ?? 'N/A'}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFCC80),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text('${_predictionResult!['severe_risk_percent'] ?? 0}% Risk', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text('Alert: ${_predictionResult!['alert'] ?? 'No alerts generated'}', style: const TextStyle(fontSize: 13, color: Colors.black87)),
                    ],
                  ),
                ),

              
              _buildNumberField('Heart Rate (bpm)', _heartRateController),
              const SizedBox(height: 12),
              _buildNumberField('Stress Level', _stressController),
              const SizedBox(height: 12),
              _buildNumberField('Hydration Level (ml)', _hydrationController),
              const SizedBox(height: 12),
              _buildNumberField('Sleep Quality', _sleepQualityController),
              const SizedBox(height: 12),
              _buildNumberField('Recovery Score', _recoveryScoreController),
              const SizedBox(height: 12),
              _buildNumberField('Step Count', _stepCountController),
              const SizedBox(height: 12),
              _buildNumberField('Training Load', _trainingLoadController),
              const SizedBox(height: 12),
              _buildNumberField('Training Intensity', _trainingIntensityController),
              const SizedBox(height: 12),
              _buildNumberField('Training Duration (mins)', _trainingDurationController),
              const SizedBox(height: 12),
              _buildNumberField('Fatigue Index', _fatigueIndexController),
              const SizedBox(height: 12),
              _buildNumberField('Age', _ageController),
              const SizedBox(height: 12),
              _buildNumberField('BMI', _bmiController),
              const SizedBox(height: 16),

              
              const Text('Sport Type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE0E0E0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedSport,
                    isExpanded: true,
                    items: ['Basketball', 'Other', 'Soccer', 'Track']
                        .map((sport) => DropdownMenuItem(value: sport, child: Text(sport)))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedSport = val!),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              
              const Text('Gender', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE0E0E0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedGender,
                    isExpanded: true,
                    items: ['Male', 'Female']
                        .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedGender = val!),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitPrediction,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFCC80),
                    foregroundColor: Colors.black,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('Run Risk Prediction', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNumberField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'This field is required';
            if (double.tryParse(value) == null) return 'Please enter a valid number';
            return null;
          },
        ),
      ],
    );
  }
}