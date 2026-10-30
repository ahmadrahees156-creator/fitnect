import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dashboard.dart';

class DetailsScreen extends StatefulWidget {
  final String token;
  const DetailsScreen({super.key, required this.token});

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  bool _isSaving = false;

  final _ageController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();

  String _selectedGoal = 'strength';
  String _selectedActivityLevel = 'moderate';
  String _selectedExperienceLevel = 'beginner';
  String _selectedWorkoutLocation = 'home';
  String _selectedDietaryPreference = 'vegetarian';

  double get _calculatedBmi {
    final heightCm = double.tryParse(_heightController.text) ?? 0;
    final weightKg = double.tryParse(_weightController.text) ?? 0;
    if (heightCm > 0 && weightKg > 0) {
      final heightM = heightCm / 100;
      return weightKg / (heightM * heightM);
    }
    return 0.0;
  }

  @override
  void initState() {
    super.initState();
    _fetchExistingProfile();
    _heightController.addListener(() => setState(() {}));
    _weightController.addListener(() => setState(() {}));
  }

  Future<void> _fetchExistingProfile() async {
    final url = Uri.parse('$_baseUrl/api/fitness-profile/me');
    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['profile'] != null) {
          final p = data['profile'];
          setState(() {
            _ageController.text = p['age']?.toString() ?? '';
            _heightController.text = p['heightCm']?.toString() ?? '';
            _weightController.text = p['weightKg']?.toString() ?? '';
            _selectedGoal = p['goal'] ?? 'strength';
            _selectedActivityLevel = p['activityLevel'] ?? 'moderate';
            _selectedExperienceLevel = p['experienceLevel'] ?? 'beginner';
            _selectedWorkoutLocation = p['workoutLocation'] ?? 'home';
            _selectedDietaryPreference = p['dietaryPreference'] ?? 'vegetarian';
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
  }

  Future<void> _saveFitnessProfile() async {
    setState(() => _isSaving = true);
    final url = Uri.parse('$_baseUrl/api/fitness-profile/me');

    final body = {
      "age": int.tryParse(_ageController.text) ?? 25,
      "sex": "female",
      "heightCm": double.tryParse(_heightController.text) ?? 168,
      "weightKg": double.tryParse(_weightController.text) ?? 62,
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
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: jsonEncode(body),
      );

      if (!mounted) return;
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Fitness profile saved successfully!')),
        );

        // Navigate to DashboardScreen with properly parsed types
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => DashboardScreen(
              token: widget.token,
              userName: 'User',
              userEmail: '',
              age: int.tryParse(_ageController.text) ?? 25,
              height: double.tryParse(_heightController.text) ?? 168.0,
              weight: double.tryParse(_weightController.text) ?? 62.0,
              bmi: _calculatedBmi,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save profile: ${response.statusCode}')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F5FC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('FitNect', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: Center(
              child: Text('Step 1 of 1', style: TextStyle(color: Color(0xFF6B4FA0), fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('PERSONALISE YOUR PLAN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 4),
            const Text('Tell us about your fitness', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('These details help FitNect personalise wellness insights and training guidance. You can update them later from your profile.', style: TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 20),

            // Age, Height, Weight row
            Row(
              children: [
                Expanded(child: _buildTextField('Age', _ageController)),
                const SizedBox(width: 12),
                Expanded(child: _buildTextField('Height (cm)', _heightController)),
                const SizedBox(width: 12),
                Expanded(child: _buildTextField('Weight (kg)', _weightController)),
              ],
            ),
            const SizedBox(height: 16),

            // BMI Box
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F8F0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('YOUR ESTIMATED BMI', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                      SizedBox(height: 2),
                      Text('Calculated automatically from your height and weight.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                  Text('${_calculatedBmi.toStringAsFixed(1)} kg/m²', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                ],
              ),
            ),
            const SizedBox(height: 20),

            _buildDropdownField('Fitness goal', ['strength', 'weight_gain', 'weight_management', 'endurance', 'general_fitness'], _selectedGoal, (val) => setState(() => _selectedGoal = val!)),
            const SizedBox(height: 12),
            _buildDropdownField('Activity level', ['sedentary', 'light', 'moderate', 'high'], _selectedActivityLevel, (val) => setState(() => _selectedActivityLevel = val!)),
            const SizedBox(height: 12),
            _buildDropdownField('Experience level', ['beginner', 'intermediate', 'advanced'], _selectedExperienceLevel, (val) => setState(() => _selectedExperienceLevel = val!)),
            const SizedBox(height: 12),
            _buildDropdownField('Workout location', ['home', 'gym', 'both'], _selectedWorkoutLocation, (val) => setState(() => _selectedWorkoutLocation = val!)),
            const SizedBox(height: 12),
            _buildDropdownField('Dietary preference', ['vegetarian', 'non_vegetarian', 'vegan', 'other'], _selectedDietaryPreference, (val) => setState(() => _selectedDietaryPreference = val!)),
            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => DashboardScreen(
                            token: widget.token,
                            userName: 'User',
                            userEmail: '',
                            age: int.tryParse(_ageController.text) ?? 25,
                            height: double.tryParse(_heightController.text) ?? 168.0,
                            weight: double.tryParse(_weightController.text) ?? 62.0,
                            bmi: _calculatedBmi,
                          ),
                        ),
                      );
                    },
                    child: const Text('Not now', style: TextStyle(color: Colors.black87)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1E1B2E),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _isSaving ? null : _saveFitnessProfile,
                    child: _isSaving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Save and continue →', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, List<String> items, String currentVal, ValueChanged<String?> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          initialValue: currentVal,
          items: items.map((item) => DropdownMenuItem(value: item, child: Text(item.toUpperCase()))).toList(),
          onChanged: onChanged,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}