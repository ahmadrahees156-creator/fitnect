import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class WorkoutScreen extends StatefulWidget {
  final String token;

  const WorkoutScreen({super.key, required this.token});

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  bool _isLoading = false;
  List<dynamic> _workouts = [];
  String _selectedCategoryFilter = 'All categories';

  final List<String> _categories = ['All categories', 'strength', 'cardio', 'flexibility', 'yoga', 'sports', 'other'];

  @override
  void initState() {
    super.initState();
    _fetchWorkouts();
  }

  Future<void> _fetchWorkouts() async {
    setState(() => _isLoading = true);
    
    String urlStr = 'https://fitnect.onrender.com/api/workouts';
    if (_selectedCategoryFilter != 'All categories') {
      urlStr += '?category=$_selectedCategoryFilter';
    }

    try {
      final response = await http.get(
        Uri.parse(urlStr),
        headers: {"Authorization": "Bearer ${widget.token}"},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _workouts = data['workouts'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching workouts: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openAddWorkoutModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => AddWorkoutModal(
        token: widget.token,
        onWorkoutAdded: _fetchWorkouts,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int totalWorkouts = _workouts.length;
    int totalMinutes = _workouts.fold(0, (sum, item) => sum + ((item['durationMinutes'] ?? 0) as int));

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6FC),
      appBar: AppBar(
        title: const Text('Training & Activity'),
        backgroundColor: const Color(0xFF8E24AA),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4A148C), Color(0xFF7B1FA2)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('YOUR MOVEMENT, YOUR PACE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white70, letterSpacing: 1.2)),
                  const SizedBox(height: 6),
                  const Text('Make every session count.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 4),
                  const Text('Explore your saved workouts and review the exercises in each session.', style: TextStyle(fontSize: 12, color: Colors.white70)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildHeaderStatCard('$totalWorkouts', 'Workouts logged'),
                      const SizedBox(width: 12),
                      _buildHeaderStatCard('$totalMinutes', 'Total workout minutes'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('TRAINING LIBRARY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.1)),
                    SizedBox(height: 2),
                    Text('Your workouts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: _openAddWorkoutModal,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4A148C),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('+ Add Workout', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),

            
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: DropdownButton<String>(
                value: _selectedCategoryFilter,
                isExpanded: true,
                underline: const SizedBox(),
                items: _categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedCategoryFilter = val);
                    _fetchWorkouts();
                  }
                },
              ),
            ),
            const SizedBox(height: 16),

            
            _isLoading
                ? const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator()))
                : _workouts.isEmpty
                    ? Container(
                        padding: const EdgeInsets.all(30),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: const Column(
                          children: [
                            Text('No workouts found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            SizedBox(height: 6),
                            Text('There are no saved workouts for this category yet.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _workouts.length,
                        itemBuilder: (context, index) {
                          final workout = _workouts[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: ListTile(
                              title: Text(workout['title'] ?? 'Workout', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('Category: ${workout['category']} · ${workout['durationMinutes']} mins'),
                              trailing: const Icon(Icons.fitness_center, color: Color(0xFF8E24AA)),
                            ),
                          );
                        },
                      ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderStatCard(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}


class AddWorkoutModal extends StatefulWidget {
  final String token;
  final VoidCallback onWorkoutAdded;

  const AddWorkoutModal({super.key, required this.token, required this.onWorkoutAdded});

  @override
  State<AddWorkoutModal> createState() => _AddWorkoutModalState();
}

class _AddWorkoutModalState extends State<AddWorkoutModal> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _durationController = TextEditingController(text: '45');
  final _exerciseNameController = TextEditingController(text: 'Push-ups');
  final _setsController = TextEditingController(text: '3');
  final _repsController = TextEditingController(text: '12');
  final _weightController = TextEditingController(text: '0');
  final _notesController = TextEditingController();

  String _selectedCategory = 'strength';
  bool _isLoading = false;

  final List<String> _categories = ['strength', 'cardio', 'flexibility', 'yoga', 'sports', 'other'];

  @override
  void dispose() {
    _titleController.dispose();
    _durationController.dispose();
    _exerciseNameController.dispose();
    _setsController.dispose();
    _repsController.dispose();
    _weightController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitWorkout() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final url = Uri.parse('https://fitnect.onrender.com/api/workouts');

    final Map<String, dynamic> body = {
      "title": _titleController.text.trim(),
      "category": _selectedCategory,
      "durationMinutes": int.tryParse(_durationController.text) ?? 45,
      "exercises": [
        {
          "name": _exerciseNameController.text.trim(),
          "sets": int.tryParse(_setsController.text) ?? 3,
          "reps": int.tryParse(_repsController.text) ?? 12,
          "weightKg": double.tryParse(_weightController.text) ?? 0.0,
        }
      ],
      "notes": _notesController.text.trim(),
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

      if (response.statusCode == 201 || response.statusCode == 200) {
        if (mounted) {
          widget.onWorkoutAdded();
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Workout created successfully! (201 Created)')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save workout: Status ${response.statusCode}')),
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
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Add a workout', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Text('Save a session to your FitNect account.', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 16),

              const Text('Workout title *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _titleController,
                decoration: _inputDecoration('e.g. Upper body day'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),

              const Text('Category *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 4),
              DropdownButtonFormField<String>(
                initialValue: _selectedCategory,
                decoration: _inputDecoration(''),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) => setState(() => _selectedCategory = val!),
              ),
              const SizedBox(height: 12),

              const Text('Duration (minutes) *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _durationController,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration('45'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              const Text('Exercise Name *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _exerciseNameController,
                decoration: _inputDecoration('e.g. Squats'),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(child: _buildNumField('Sets', _setsController)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildNumField('Reps', _repsController)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildNumField('Weight (kg)', _weightController)),
                ],
              ),
              const SizedBox(height: 12),

              const Text('Notes (optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _notesController,
                decoration: _inputDecoration('How did the session feel?'),
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _isLoading ? null : _submitWorkout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4A148C),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _isLoading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save workout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNumField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('0'),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFFFAFAFA),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
    );
  }
}