import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dashboard.dart'; 

class DetailsScreen extends StatefulWidget {
  final String token;
  final String userName;
  final String userEmail;

  const DetailsScreen({
    super.key,
    required this.token,
    required this.userName,
    required this.userEmail,
  });

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  final _formKey = GlobalKey<FormState>();

  
  final _ageController = TextEditingController(text: '');
  final _heightController = TextEditingController(text: '');
  final _weightController = TextEditingController(text: '');

  
  String _selectedGoal = 'strength';
  String _selectedActivityLevel = 'light';
  String _selectedExperienceLevel = 'beginner';
  String _selectedWorkoutLocation = 'home';
  String _selectedDietaryPreference = 'vegetarian';

  bool _isLoading = false;

  
  final List<Map<String, String>> _goalOptions = [
    {'label': 'Strength', 'value': 'strength'},
    {'label': 'Weight Gain', 'value': 'weight_gain'},
    {'label': 'Weight Management', 'value': 'weight_management'},
    {'label': 'Endurance', 'value': 'endurance'},
    {'label': 'General Fitness', 'value': 'general_fitness'},
  ];

  final List<Map<String, String>> _activityOptions = [
    {'label': 'Sedentary', 'value': 'sedentary'},
    {'label': 'Light', 'value': 'light'},
    {'label': 'Moderate', 'value': 'moderate'},
    {'label': 'High', 'value': 'high'},
  ];

  final List<Map<String, String>> _experienceOptions = [
    {'label': 'Beginner', 'value': 'beginner'},
    {'label': 'Intermediate', 'value': 'intermediate'},
    {'label': 'Advanced', 'value': 'advanced'},
  ];

  final List<Map<String, String>> _locationOptions = [
    {'label': 'Home', 'value': 'home'},
    {'label': 'Gym', 'value': 'gym'},
    {'label': 'Both', 'value': 'both'},
  ];

  final List<Map<String, String>> _dietOptions = [
    {'label': 'Vegetarian', 'value': 'vegetarian'},
    {'label': 'Non-Vegetarian', 'value': 'non_vegetarian'},
    {'label': 'Vegan', 'value': 'vegan'},
    {'label': 'Other', 'value': 'other'},
  ];

  @override
  void dispose() {
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  
  double _calculateBmi() {
    final heightCm = double.tryParse(_heightController.text) ?? 0;
    final weightKg = double.tryParse(_weightController.text) ?? 0;
    if (heightCm <= 0 || weightKg <= 0) return 0.0;
    final heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  Future<void> _saveFitnessProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    
   final url = Uri.parse('https://fitnect-api-1k4t.onrender.com/api/fitness-profile/me');

    final Map<String, dynamic> body = {
      "age": int.tryParse(_ageController.text) ?? 20,
      "heightCm": double.tryParse(_heightController.text) ?? 160,
      "weightKg": double.tryParse(_weightController.text) ?? 55,
      "goal": _selectedGoal,
      "activityLevel": _selectedActivityLevel,
      "experienceLevel": _selectedExperienceLevel,
      "workoutLocation": _selectedWorkoutLocation,
      "dietaryPreference": _selectedDietaryPreference,
    };

    try {
      final response = await http.put(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.token}",
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => DashboardScreen(
                token: widget.token,
                userName: widget.userName,
                userEmail: widget.userEmail,
                age: int.parse(_ageController.text),
                height: double.parse(_heightController.text),
                weight: double.parse(_weightController.text),
                bmi: _calculateBmi(),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save profile: Status ${response.statusCode}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Connection error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bmiValue = _calculateBmi();

    return Scaffold(
      backgroundColor: const Color(0xFFF3EEF9),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 600),
            padding: const EdgeInsets.all(28.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'FitNect',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF8E24AA)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F5E9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Step 1 of 1',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF2E7D32)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text('PERSONALISE YOUR PLAN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
                  const SizedBox(height: 4),
                  const Text('Tell us about your fitness', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 6),
                  const Text(
                    'These details help FitNect personalise wellness insights and training guidance. You can update them later from your profile.',
                    style: TextStyle(fontSize: 13, color: Colors.black54, height: 1.4),
                  ),
                  const SizedBox(height: 24),

                  
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Age', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _ageController,
                              keyboardType: TextInputType.number,
                              decoration: _inputDecoration(),
                              validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Height (cm)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _heightController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: _inputDecoration(),
                              onChanged: (_) => setState(() {}),
                              validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Weight (kg)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _weightController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: _inputDecoration(),
                              onChanged: (_) => setState(() {}),
                              validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  
                 Container(
                 padding: const EdgeInsets.all(16),
                 decoration: BoxDecoration(
                 color: const Color(0xFFE8F5E9), 
                 borderRadius: BorderRadius.circular(12),
                 border: Border.all(color: Colors.green.shade200),
                 ),
                 child: Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                 child: Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: const [
            Text(
              'YOUR ESTIMATED BMI',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'Calculated automatically from your height and weight.',
              style: TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ],
        ),
      ),
      const SizedBox(width: 8),
      
      Text(
        '${bmiValue.toStringAsFixed(1)} kg/m²',
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.green,
        ),
      ),
    ],
  ),
),
                  const SizedBox(height: 16),

                  
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Fitness goal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedGoal,
                              decoration: _inputDecoration(),
                              items: _goalOptions.map((g) => DropdownMenuItem(value: g['value'], child: Text(g['label']!))).toList(),
                              onChanged: (val) => setState(() => _selectedGoal = val!),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Activity level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedActivityLevel,
                              decoration: _inputDecoration(),
                              items: _activityOptions.map((a) => DropdownMenuItem(value: a['value'], child: Text(a['label']!))).toList(),
                              onChanged: (val) => setState(() => _selectedActivityLevel = val!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Experience level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedExperienceLevel,
                              decoration: _inputDecoration(),
                              items: _experienceOptions.map((e) => DropdownMenuItem(value: e['value'], child: Text(e['label']!))).toList(),
                              onChanged: (val) => setState(() => _selectedExperienceLevel = val!),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Workout location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedWorkoutLocation,
                              decoration: _inputDecoration(),
                              items: _locationOptions.map((w) => DropdownMenuItem(value: w['value'], child: Text(w['label']!))).toList(),
                              onChanged: (val) => setState(() => _selectedWorkoutLocation = val!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                
                  const Text('Dietary preference', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedDietaryPreference,
                    decoration: _inputDecoration(),
                    items: _dietOptions.map((d) => DropdownMenuItem(value: d['value'], child: Text(d['label']!))).toList(),
                    onChanged: (val) => setState(() => _selectedDietaryPreference = val!),
                  ),
                  const SizedBox(height: 30),

                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (context) => DashboardScreen(
                                token: widget.token,
                                userName: widget.userName,
                               userEmail: widget.userEmail,
                                age: int.tryParse(_ageController.text) ?? 20,
                                height: double.tryParse(_heightController.text) ?? 165.0,
                                weight: double.tryParse(_weightController.text) ?? 60.0,
                                bmi: _calculateBmi(),
                              ),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: const BorderSide(color: Colors.grey),
                        ),
                        child: Text('Not now', style: TextStyle(color: Colors.black.withValues(alpha: 0.7))),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _saveFitnessProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFB74D),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: _isLoading
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Save and continue →', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFFFAFAFA),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
    );
  }
}