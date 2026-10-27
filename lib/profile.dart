import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class ProfileScreen extends StatefulWidget {
  final String token;

  const ProfileScreen({super.key, required this.token});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers for text fields
  final _ageController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();

  // Dropdown selections
  String _selectedGoal = 'Strength';
  String _selectedActivity = 'Light';
  String _selectedExperience = 'Beginner';
  String _selectedLocation = 'Home';
  String _selectedDiet = 'Vegetarian';

  bool _isEditing = false; 
  bool _isLoading = false;
  bool _isFetching = true;

  final List<String> _goals = ['Strength', 'Weight loss', 'Endurance',];
  final List<String> _activities = ['Sedentary', 'Light', 'Moderate', 'Very active'];
  final List<String> _experiences = ['Beginner', 'Intermediate', 'Advanced'];
  final List<String> _locations = ['Home', 'Gym', 'Outdoor'];
  final List<String> _diets = ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Omnivore', 'None'];

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  @override
  void dispose() {
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  
  Future<void> _fetchProfileData() async {
    setState(() => _isFetching = true);

    final url = Uri.parse('https://fitnect.onrender.com/api/fitness-profile/me');

    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.token}",
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final profile = data['profile'] ?? data;

        setState(() {
          _ageController.text = profile['age']?.toString() ?? '';
          _heightController.text = profile['height']?.toString() ?? '';
          _weightController.text = profile['weight']?.toString() ?? '';

          if (profile['fitnessGoal'] != null && _goals.contains(profile['fitnessGoal'])) {
            _selectedGoal = profile['fitnessGoal'];
          }
          if (profile['activityLevel'] != null && _activities.contains(profile['activityLevel'])) {
            _selectedActivity = profile['activityLevel'];
          }
          if (profile['experienceLevel'] != null && _experiences.contains(profile['experienceLevel'])) {
            _selectedExperience = profile['experienceLevel'];
          }
          if (profile['workoutLocation'] != null && _locations.contains(profile['workoutLocation'])) {
            _selectedLocation = profile['workoutLocation'];
          }
          if (profile['dietaryPreference'] != null && _diets.contains(profile['dietaryPreference'])) {
            _selectedDiet = profile['dietaryPreference'];
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    } finally {
      if (mounted) setState(() => _isFetching = false);
    }
  }

  
  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final url = Uri.parse('https://fitnect.onrender.com/api/fitness-profile/me');

    final Map<String, dynamic> body = {
      "age": int.tryParse(_ageController.text) ?? 20,
      "height": double.tryParse(_heightController.text) ?? 165.0,
      "weight": double.tryParse(_weightController.text) ?? 60.0,
      "fitnessGoal": _selectedGoal,
      "activityLevel": _selectedActivity,
      "experienceLevel": _selectedExperience,
      "workoutLocation": _selectedLocation,
      "dietaryPreference": _selectedDiet,
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

      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() => _isEditing = false); 
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Fitness profile updated successfully!')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to update profile: Status ${response.statusCode}')),
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
    return Scaffold(
      backgroundColor: const Color(0xFFF9F6FC),
      appBar: AppBar(
        title: const Text('Fitness Profile'),
        backgroundColor: const Color(0xFF8E24AA),
        foregroundColor: Colors.white,
        actions: [
          
          if (!_isFetching)
            IconButton(
              icon: Icon(_isEditing ? Icons.close : Icons.edit),
              onPressed: () {
                setState(() {
                  _isEditing = !_isEditing;
                });
              },
              tooltip: _isEditing ? 'Cancel' : 'Edit details',
            ),
        ],
      ),
      body: _isFetching
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8E24AA)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
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
                            'Your Fitness Details',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          TextButton.icon(
                            onPressed: () {
                              setState(() {
                                _isEditing = !_isEditing;
                              });
                            },
                            icon: Icon(_isEditing ? Icons.visibility : Icons.edit, size: 16, color: const Color(0xFF8E24AA)),
                            label: Text(
                              _isEditing ? 'View Mode' : 'Edit Details',
                              style: const TextStyle(color: Color(0xFF8E24AA), fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isEditing
                            ? 'Modify your details below and save your changes.'
                            : 'Here are the details you saved during onboarding.',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(height: 20),

                      
                      Row(
                        children: [
                          Expanded(child: _buildNumberField('Age', _ageController, _isEditing)),
                          const SizedBox(width: 10),
                          Expanded(child: _buildNumberField('Height (cm)', _heightController, _isEditing)),
                          const SizedBox(width: 10),
                          Expanded(child: _buildNumberField('Weight (kg)', _weightController, _isEditing)),
                        ],
                      ),
                      const SizedBox(height: 16),

                      
                      _buildDropdownField('Fitness goal', _selectedGoal, _goals, _isEditing, (val) => setState(() => _selectedGoal = val!)),
                      const SizedBox(height: 12),
                      _buildDropdownField('Activity level', _selectedActivity, _activities, _isEditing, (val) => setState(() => _selectedActivity = val!)),
                      const SizedBox(height: 12),
                      _buildDropdownField('Experience level', _selectedExperience, _experiences, _isEditing, (val) => setState(() => _selectedExperience = val!)),
                      const SizedBox(height: 12),
                      _buildDropdownField('Workout location', _selectedLocation, _locations, _isEditing, (val) => setState(() => _selectedLocation = val!)),
                      const SizedBox(height: 12),
                      _buildDropdownField('Dietary preference', _selectedDiet, _diets, _isEditing, (val) => setState(() => _selectedDiet = val!)),
                      
                      if (_isEditing) ...[
                        const SizedBox(height: 24),
                        
                        ElevatedButton(
                          onPressed: _isLoading ? null : _saveProfile,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8E24AA),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: _isLoading
                              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildNumberField(String label, TextEditingController controller, bool enabled) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          enabled: enabled,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: _inputDecoration('0', enabled),
          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, String currentVal, List<String> items, bool enabled, ValueChanged<String?> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          initialValue: currentVal,
          
          items: items.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
          onChanged: enabled ? onChanged : null,
          decoration: _inputDecoration('', enabled),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint, bool enabled) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: enabled ? const Color(0xFFFAFAFA) : Colors.grey.shade100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade200)),
    );
  }
}