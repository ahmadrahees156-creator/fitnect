import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class InjuryRiskScreen extends StatefulWidget {
  final String token;

  const InjuryRiskScreen({super.key, required this.token});

  @override
  State<InjuryRiskScreen> createState() => _InjuryRiskScreenState();
}

class _InjuryRiskScreenState extends State<InjuryRiskScreen> {
  final _formKey = GlobalKey<FormState>();

  
  final _heartRateController = TextEditingController();
  final _stressLevelController = TextEditingController();
  final _hydrationLevelController = TextEditingController();
  final _sleepQualityController = TextEditingController();
  final _recoveryScoreController = TextEditingController();
  final _stepCountController = TextEditingController();
  final _trainingLoadController = TextEditingController();
  final _trainingIntensityController = TextEditingController();
  final _trainingDurationController = TextEditingController();
  final _fatigueIndexController = TextEditingController();
  final _ageController = TextEditingController();
  final _bmiController = TextEditingController();

  
  String _selectedSportType = 'Soccer';
  String _selectedGender = 'Male';

  bool _isLoading = false;
  Map<String, dynamic>? _apiResult;

  final List<String> _sportTypes = ['Basketball', 'Other', 'Soccer', 'Track'];
  final List<String> _genders = ['Male', 'Female'];

  @override
  void dispose() {
    _heartRateController.dispose();
    _stressLevelController.dispose();
    _hydrationLevelController.dispose();
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

  Future<void> _submitPredictionData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _apiResult = null;
    });

    
    final url = Uri.parse('https://fitnect.onrender.com/api/injury-risk/predict');

    final Map<String, dynamic> body = {
      "heart_rate": double.parse(_heartRateController.text),
      "stress_level": double.parse(_stressLevelController.text),
      "hydration_level": double.parse(_hydrationLevelController.text),
      "sleep_quality": double.parse(_sleepQualityController.text),
      "recovery_score": double.parse(_recoveryScoreController.text),
      "step_count": double.parse(_stepCountController.text),
      "training_load": double.parse(_trainingLoadController.text),
      "training_intensity": double.parse(_trainingIntensityController.text),
      "training_duration": double.parse(_trainingDurationController.text),
      "fatigue_index": double.parse(_fatigueIndexController.text),
      "sport_type": _selectedSportType,
      "gender": _selectedGender,
      "age": double.parse(_ageController.text),
      "bmi": double.parse(_bmiController.text),
    };

    try {
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.token}",
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _apiResult = data;
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Server Error: Status code ${response.statusCode}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Connection Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F6FC),
      appBar: AppBar(
        title: const Text('Injury Risk Analysis'),
        backgroundColor: const Color(0xFF8E24AA),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildNumberField('Heart Rate (bpm)', _heartRateController),
              _buildNumberField('Stress Level (a.u.)', _stressLevelController),
              _buildNumberField('Hydration Level (%)', _hydrationLevelController),
              _buildNumberField('Sleep Quality Score', _sleepQualityController),
              _buildNumberField('Recovery Score', _recoveryScoreController),
              _buildNumberField('Step Count', _stepCountController),
              _buildNumberField('Training Load', _trainingLoadController),
              _buildNumberField('Training Intensity (RPE 2-10)', _trainingIntensityController),
              _buildNumberField('Training Duration (mins)', _trainingDurationController),
              _buildNumberField('Fatigue Index', _fatigueIndexController),
              _buildNumberField('Age (years)', _ageController),
              _buildNumberField('BMI', _bmiController),

              // Sport Type Dropdown
              const SizedBox(height: 12),
              const Text('Sport Type', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _selectedSportType,
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                items: _sportTypes.map((sport) {
                  return DropdownMenuItem(value: sport, child: Text(sport));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedSportType = val);
                },
              ),

              
              const SizedBox(height: 12),
              const Text('Gender', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _selectedGender,
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                items: _genders.map((gender) {
                  return DropdownMenuItem(value: gender, child: Text(gender));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedGender = val);
                },
              ),

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitPredictionData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8E24AA),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    .toString() == 'true' 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Analyze Injury Risk', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
              ),

              
              if (_apiResult != null) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF8E24AA).withValues(alpha: 0.3)), 
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Prediction Results', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF8E24AA))),
                      const Divider(),
                      const SizedBox(height: 8),
                      Text('Prediction: ${_apiResult!['prediction'] ?? 'N/A'}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      Text('Risk Level: ${_apiResult!['risk_level'] ?? 'N/A'}', style: const TextStyle(fontSize: 14)),
                      const SizedBox(height: 6),
                      Text('Severe Risk Probability: ${_apiResult!['severe_risk_percent'] ?? 0.0}%', style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNumberField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            enableSuggestions: false,
            autocorrect: false,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return 'This field is required';
              if (double.tryParse(value) == null) return 'Please enter a valid number';
              return null;
            },
          ),
        ],
      ),
    );
  }
}