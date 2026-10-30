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
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  bool _isLoading = false;

  // All controllers empty by default so "Enter value" shows up
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

  String _selectedSportType = 'Other';
  String _selectedGender = 'Female';

  // --- PREDICT INJURY RISK API ---
  Future<void> _predictInjuryRisk() async {
    setState(() => _isLoading = true);
    final url = Uri.parse('$_baseUrl/api/injury-risk/predict');

    final body = {
      "heart_rate": double.tryParse(_heartRateController.text) ?? 75,
      "stress_level": double.tryParse(_stressLevelController.text) ?? 3,
      "hydration_level": double.tryParse(_hydrationLevelController.text) ?? 4,
      "sleep_quality": double.tryParse(_sleepQualityController.text) ?? 4,
      "recovery_score": double.tryParse(_recoveryScoreController.text) ?? 80,
      "step_count": double.tryParse(_stepCountController.text) ?? 8000,
      "training_load": double.tryParse(_trainingLoadController.text) ?? 60,
      "training_intensity": double.tryParse(_trainingIntensityController.text) ?? 6,
      "training_duration": double.tryParse(_trainingDurationController.text) ?? 45,
      "fatigue_index": double.tryParse(_fatigueIndexController.text) ?? 3,
      "sport_type": _selectedSportType,
      "gender": _selectedGender,
      "age": double.tryParse(_ageController.text) ?? 20,
      "bmi": double.tryParse(_bmiController.text) ?? 20.6,
    };

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: jsonEncode(body),
      );

      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _showResultDialog(data);
      } else if (response.statusCode == 503) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Server is waking up (503). Please wait 10 seconds and retry.')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Prediction failed: ${response.statusCode}')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- RESULT MODAL DIALOG ---
  void _showResultDialog(Map<String, dynamic> data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('AI Injury Risk Assessment', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Prediction: ${data['prediction'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF6B4FA0))),
              const SizedBox(height: 8),
              Text('Risk Level: ${data['risk_level'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Recovery Band: ${data['recovery_band'] ?? 'N/A'}'),
              const SizedBox(height: 4),
              Text('Severe Risk Probability: ${data['severe_risk_probability'] ?? 0}'),
              const SizedBox(height: 4),
              Text('Recovery Score Estimated: ${data['recovery_score_estimated'] ?? 0}'),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E1B2E)),
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _clearInputs() {
    _heartRateController.clear();
    _stressLevelController.clear();
    _hydrationLevelController.clear();
    _sleepQualityController.clear();
    _recoveryScoreController.clear();
    _stepCountController.clear();
    _trainingLoadController.clear();
    _trainingIntensityController.clear();
    _trainingDurationController.clear();
    _fatigueIndexController.clear();
    _ageController.clear();
    _bmiController.clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F5FC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'FitNect\nInjury Risk',
          style: TextStyle(color: Colors.black54, fontSize: 12, height: 1.2),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              backgroundColor: const Color(0xFF10B981),
              radius: 14,
              child: const Text('A', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- TOP BANNER ---
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1B2E),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('AI-POWERED ASSESSMENT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 6),
                        const Text('Listen to your body.\nTrain with awareness.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white, height: 1.2)),
                        const SizedBox(height: 6),
                        const Text('Enter your current wellness and training measurements to request a severe injury risk estimate from FitNect’s prediction service.', style: TextStyle(fontSize: 10, color: Colors.white70)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: const [
                        Text('Ready when you are', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                        SizedBox(height: 2),
                        Text('Complete the assessment', style: TextStyle(color: Colors.white70, fontSize: 9)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text('PREDICTION INPUTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 4),
            const Text('Your training and recovery details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Use values measured or recorded for you. The stress, sleep, recovery, training-load and fatigue fields must follow the model’s input scale. Don’t guess if you don’t know those values.', style: TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 16),

            // --- INPUT FIELDS GRID WITH TIGHTER SPACING ---
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 1.65,
              children: [
                _buildTextField('Heart rate', 'bpm', _heartRateController),
                _buildTextField('Stress level', 'model scale [0-10]', _stressLevelController),
                _buildTextField('Hydration level', 'primary scale [1-10]', _hydrationLevelController),
                _buildTextField('Sleep quality', 'model scale [1-10]', _sleepQualityController),
                _buildTextField('Recovery score', 'model scale [0-100]', _recoveryScoreController),
                _buildTextField('Steps today', 'steps', _stepCountController),
                _buildTextField('Training load', 'model scale [0-250]', _trainingLoadController),
                _buildTextField('Training intensity', 'RPE [1-10]', _trainingIntensityController),
                _buildTextField('Training duration', 'minutes', _trainingDurationController),
                _buildTextField('Fatigue index', 'model scale [1-10]', _fatigueIndexController),
                _buildTextField('Age', 'years', _ageController),
                _buildTextField('BMI', 'kg/m²', _bmiController),
              ],
            ),
            const SizedBox(height: 16),

            // --- DROPDOWNS ---
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Sport type', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedSportType,
                        items: ['Basketball', 'Other', 'Soccer', 'Track']
                            .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                            .toList(),
                        onChanged: (val) => setState(() => _selectedSportType = val ?? 'Other'),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Gender', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedGender,
                        items: ['Male', 'Female']
                            .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                            .toList(),
                        onChanged: (val) => setState(() => _selectedGender = val ?? 'Female'),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // --- ACTION BUTTONS ---
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1E1B2E),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _isLoading ? null : _predictInjuryRisk,
                    child: _isLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Predict severe-injury risk', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    onPressed: _clearInputs,
                    child: const Text('Clear inputs', style: TextStyle(color: Colors.black87, fontSize: 12)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // --- INFO CARDS BOTTOM ---
            Row(
              children: [
                _buildInfoCard('BEFORE TRAINING', 'Warm up properly', 'Start sessions with 5–10 minutes of easy movement and dynamic mobility.'),
                const SizedBox(width: 8),
                _buildInfoCard('TRAINING LOAD', 'Increase load gradually', 'Avoid sudden spikes in workout duration, intensity or weekly frequency.'),
                const SizedBox(width: 8),
                _buildInfoCard('DAILY RECOVERY', 'Make recovery count', 'Prioritize sleep, hydration and nutrition. Adjust your session if you feel unusual.'),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, String limitHint, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
            Text(limitHint, style: const TextStyle(fontSize: 8, color: Colors.grey)),
          ],
        ),
        const SizedBox(height: 4),
        Expanded(
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            style: const TextStyle(fontSize: 12),
            decoration: InputDecoration(
              hintText: 'Enter value',
              hintStyle: TextStyle(fontSize: 10, color: Colors.grey.shade400),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard(String tag, String title, String description) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tag, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF6B4FA0))),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(description, style: const TextStyle(fontSize: 9, color: Colors.grey), maxLines: 3, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}