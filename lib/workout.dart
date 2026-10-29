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
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  // ignore: unused_field
  bool _isLoadingStats = true;
  bool _isLoadingLibrary = true;
  // ignore: unused_field
  bool _isSaving = false;

  // Stats Data
  int _totalWorkouts = 0;
  int _totalMinutes = 0;

  // Workouts Lists & Library Data
  List<dynamic> _todayWorkouts = [];
  List<dynamic> _libraryWorkouts = [];
  String _searchQuery = '';
  final String _selectedCategory = 'all';
  final String _selectedDifficulty = 'all';

  @override
  void initState() {
    super.initState();
    _fetchTodayWorkouts();
    _fetchWorkoutLibrary();
  }

  // --- 1. FETCH TODAY'S WORKOUTS & CALCULATE STATS ---
  Future<void> _fetchTodayWorkouts() async {
    final url = Uri.parse('$_baseUrl/api/workouts');
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
        if (data['workouts'] != null) {
          final List workouts = data['workouts'];
          
          int totalMins = 0;
          for (var item in workouts) {
            totalMins += (item['durationMinutes'] as num?)?.toInt() ?? 0;
          }

          setState(() {
            _todayWorkouts = workouts;
            _totalWorkouts = workouts.length;
            _totalMinutes = totalMins;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching today workouts: $e');
    } finally {
      if (mounted) setState(() => _isLoadingStats = false);
    }
  }

  // --- 2. FETCH WORKOUT LIBRARY ---
  Future<void> _fetchWorkoutLibrary() async {
    setState(() => _isLoadingLibrary = true);
    
    String queryParams = '?limit=12';
    if (_searchQuery.isNotEmpty) queryParams += '&search=$_searchQuery';
    if (_selectedCategory != 'all') queryParams += '&category=$_selectedCategory';
    if (_selectedDifficulty != 'all') queryParams += '&difficulty=$_selectedDifficulty';

    final url = Uri.parse('$_baseUrl/api/workout-library$queryParams');
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
        if (data['workouts'] != null) {
          setState(() {
            _libraryWorkouts = data['workouts'];
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching library: $e');
    } finally {
      if (mounted) setState(() => _isLoadingLibrary = false);
    }
  }

  // --- 3. FETCH INDIVIDUAL EXERCISE DETAILS ---
  Future<void> _fetchExerciseDetails(String exerciseId) async {
    final url = Uri.parse('$_baseUrl/api/workout-library/$exerciseId');
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
        final workout = data['workout'] ?? data;
        
        if (!mounted) return;
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(workout['name'] ?? 'Exercise Details', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Category: ${(workout['category'] ?? 'Strength').toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF6B4FA0))),
                  const SizedBox(height: 8),
                  const Text('Instructions:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  if (workout['instructions'] != null && (workout['instructions'] as List).isNotEmpty)
                    ...((workout['instructions'] as List).map((inst) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text('• $inst', style: const TextStyle(fontSize: 11)),
                        )))
                  else
                    const Text('Follow proper form and steady breathing throughout the movement.', style: TextStyle(fontSize: 11)),
                  
                  if (workout['equipment'] != null && (workout['equipment'] as List).isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Text('Equipment:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text((workout['equipment'] as List).join(', '), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      debugPrint('Error fetching exercise details: $e');
    }
  }

  // --- 4. DELETE WORKOUT ---
  Future<void> _deleteWorkout(String id) async {
    final url = Uri.parse('$_baseUrl/api/workouts/$id');
    try {
      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Workout deleted successfully!')),
        );
        _fetchTodayWorkouts();
      }
    } catch (e) {
      debugPrint('Error deleting workout: $e');
    }
  }

  // --- 5. POST LOG WORKOUT ---
  Future<void> _logWorkout({
    required String title,
    required String category,
    required int durationMinutes,
    required String exerciseName,
    required int sets,
    required int reps,
    required double weightKg,
    String? notes,
  }) async {
    setState(() => _isSaving = true);
    final url = Uri.parse('$_baseUrl/api/workouts');

    final body = {
      "title": title,
      "category": category,
      "date": DateTime.now().toIso8601String(),
      "durationMinutes": durationMinutes,
      "exercises": [
        {
          "name": exerciseName,
          "sets": sets,
          "reps": reps,
          "weightKg": weightKg,
        }
      ],
      "notes": notes ?? ""
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
      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Workout logged successfully!')),
        );
        _fetchTodayWorkouts();     
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to log workout: ${response.statusCode}')),
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

  // --- SHOW ADD WORKOUT MODAL ---
  void _showAddWorkoutDialog() {
    final titleController = TextEditingController(text: 'Upper Body Day');
    final durationController = TextEditingController(text: '45');
    final exerciseController = TextEditingController(text: 'Pushups');
    final setsController = TextEditingController(text: '3');
    final repsController = TextEditingController(text: '12');
    final weightController = TextEditingController(text: '0');
    final notesController = TextEditingController(text: 'Felt great!');
    String selectedCat = 'strength';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add a workout', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Workout Title')),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: selectedCat,
                items: ['strength', 'cardio', 'flexibility', 'yoga', 'sports', 'other']
                    .map((c) => DropdownMenuItem(value: c, child: Text(c.toUpperCase())))
                    .toList(),
                onChanged: (val) => selectedCat = val ?? 'strength',
                decoration: const InputDecoration(labelText: 'Category'),
              ),
              const SizedBox(height: 8),
              TextField(controller: durationController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Duration (minutes)')),
              const SizedBox(height: 8),
              TextField(controller: exerciseController, decoration: const InputDecoration(labelText: 'Exercise Name')),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: TextField(controller: setsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Sets'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: repsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Reps'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: weightController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Weight (kg)'))),
                ],
              ),
              const SizedBox(height: 8),
              TextField(controller: notesController, decoration: const InputDecoration(labelText: 'Notes (optional)')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color.fromARGB(255, 116, 92, 129)),
            onPressed: () {
              Navigator.pop(context);
              _logWorkout(
                title: titleController.text,
                category: selectedCat,
                durationMinutes: int.tryParse(durationController.text) ?? 45,
                exerciseName: exerciseController.text,
                sets: int.tryParse(setsController.text) ?? 3,
                reps: int.tryParse(repsController.text) ?? 10,
                weightKg: double.tryParse(weightController.text) ?? 0,
                notes: notesController.text,
              );
            },
            child: const Text('Save workout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 221, 216, 235), 
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'FitNect\nTraining & Activity',
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
            // --- HERO BANNER ---
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color.fromARGB(255, 66, 25, 82),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('YOUR MOVEMENT, YOUR PACE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 6),
                  const Text(
                    'Make every session count.',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  const Text('Explore your saved workouts and review the exercises in each session.', style: TextStyle(fontSize: 11, color: Colors.white70)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildStatBox('$_totalWorkouts', 'Workouts logged'),
                      const SizedBox(width: 12),
                      _buildStatBox('$_totalMinutes', 'Total workout minutes'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // --- TODAY'S TRAINING SECTION ---
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Today's workouts", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromARGB(255, 66, 25, 82),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onPressed: _showAddWorkoutDialog,
                  icon: const Icon(Icons.add, size: 16, color: Colors.white),
                  label: const Text('Add Workout', style: TextStyle(fontSize: 11, color: Colors.white)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _todayWorkouts.isEmpty
                ? Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: const [
                        Text('No workouts found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        SizedBox(height: 4),
                        Text('No workouts saved today yet. Add one from the Workout Library below.', style: TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
                      ],
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _todayWorkouts.length,
                    itemBuilder: (context, index) {
                      final workout = _todayWorkouts[index];
                      final workoutId = workout['_id'] ?? workout['id'];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(workout['title'] ?? 'Workout', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                Text('${workout['category']?.toUpperCase()} • ${workout['durationMinutes']} mins', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              ],
                            ),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(color: const Color(0xFFF0ECF9), borderRadius: BorderRadius.circular(8)),
                                  child: const Text('Logged', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF6B4FA0))),
                                ),
                                if (workoutId != null) ...[
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                    onPressed: () => _deleteWorkout(workoutId),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
            const SizedBox(height: 24),

            // --- WORKOUT LIBRARY SECTION ---
            const Text('Workout library', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Explore guided sessions, find the right intensity, and choose a workout that fits your day.', style: TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 12),

            // Search Bar
            TextField(
              onChanged: (val) {
                setState(() => _searchQuery = val);
                _fetchWorkoutLibrary();
              },
              decoration: InputDecoration(
                hintText: 'Search workouts or muscles...',
                prefixIcon: const Icon(Icons.search, size: 18),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 12),

            // Library Cards Grid / List
            _isLoadingLibrary
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF6B4FA0)))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _libraryWorkouts.length,
                    itemBuilder: (context, index) {
                      final item = _libraryWorkouts[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6, offset: const Offset(0, 2))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: const Color(0xFFF0ECF9), borderRadius: BorderRadius.circular(6)),
                                  child: Text(item['category']?.toUpperCase() ?? 'STRENGTH', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF6B4FA0))),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6)),
                                  child: Text(item['difficulty'] ?? 'Beginner', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(item['name'] ?? 'Workout Exercise', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(
                              item['instructions'] != null && (item['instructions'] as List).isNotEmpty
                                  ? item['instructions'][0]
                                  : 'Follow proper form and steady breathing throughout the movement.',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton(
                                  onPressed: () {
                                    final exerciseId = item['_id'] ?? item['id'];
                                    if (exerciseId != null) {
                                      _fetchExerciseDetails(exerciseId);
                                    }
                                  },
                                  child: const Text('View details', style: TextStyle(fontSize: 11, color: Colors.black87)),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: const Color.fromARGB(255, 66, 25, 82),),
                                  onPressed: () {
                                    _logWorkout(
                                      title: item['name'] ?? 'Library Workout',
                                      category: item['category'] ?? 'strength',
                                      durationMinutes: 30,
                                      exerciseName: item['name'] ?? 'Exercise',
                                      sets: 3,
                                      reps: 10,
                                      weightKg: 0,
                                    );
                                  },
                                  child: const Text('+ Add today', style: TextStyle(fontSize: 11, color: Colors.white)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}