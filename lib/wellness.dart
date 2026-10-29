import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class WellnessScreen extends StatefulWidget {
  final String token;
  const WellnessScreen({super.key, required this.token});

  @override
  State<WellnessScreen> createState() => _WellnessScreenState();
}

class _WellnessScreenState extends State<WellnessScreen> {
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  bool _isLoading = true;
  bool _isSaving = false;

  
  String _selectedMood = 'good';
  double _sleepHours = 7.0;
  String _selectedSleepQuality = 'good';
  double _energyLevel = 6.0;
  double _stressLevel = 2.0;
  int _sorenessLevel = 2;
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchTodayWellness();
  }

  
  Future<void> _fetchTodayWellness() async {
    setState(() => _isLoading = true);
    final url = Uri.parse('$_baseUrl/api/wellness/today');

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
        if (data['success'] == true && data['wellness'] != null) {
          final w = data['wellness'];
          setState(() {
            _selectedMood = w['mood'] ?? 'good';
            _sleepHours = (w['sleepHours'] as num?)?.toDouble() ?? 7.0;
            _selectedSleepQuality = w['sleepQuality'] ?? 'good';
            _energyLevel = (w['energy'] as num?)?.toDouble() ?? 6.0;
            _stressLevel = (w['stress'] as num?)?.toDouble() ?? 2.0;
            _sorenessLevel = (w['soreness'] as num?)?.toInt() ?? 2;
            _notesController.text = w['notes'] ?? '';
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching today wellness: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  
  Future<void> _submitWellnessCheckIn() async {
    setState(() => _isSaving = true);
    final url = Uri.parse('$_baseUrl/api/wellness');

    final body = {
      "mood": _selectedMood,
      "energy": _energyLevel.toInt(),
      "sleepHours": _sleepHours,
      "sleepQuality": _selectedSleepQuality,
      "stress": _stressLevel.toInt(),
      "soreness": _sorenessLevel,
      "notes": _notesController.text.trim(),
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

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Wellness check-in saved successfully!')),
        );
        _fetchTodayWellness(); 
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: ${response.statusCode}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving check-in: $e')),
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFA4A2B8), 
      appBar: AppBar(
        title: const Text('Wellness Check-in'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  
                  _buildHeroHeader(),
                  const SizedBox(height: 16),

                  
                  _buildMoodSection(),
                  const SizedBox(height: 16),

                  
                  _buildSleepSection(),
                  const SizedBox(height: 16),

                  
                  _buildEnergyAndStressSection(),
                  const SizedBox(height: 16),

                  
                  _buildSorenessSection(),
                  const SizedBox(height: 24),

                
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E1B2E),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: _isSaving ? null : _submitWellnessCheckIn,
                      child: _isSaving
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Save check-in', style: TextStyle(fontSize: 16, color: Colors.white)),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  

  Widget _buildHeroHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white..withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Check in with yourself.',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E1B2E)),
          ),
          SizedBox(height: 6),
          Text(
            'A little awareness goes a long way. Track how you feel, how you recover, and what your body needs today.',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildMoodSection() {
    final moods = [
      {'key': 'great', 'label': 'Great', 'emoji': '😄'},
      {'key': 'good', 'label': 'Good', 'emoji': '🙂'},
      {'key': 'okay', 'label': 'Okay', 'emoji': '😐'},
      {'key': 'low', 'label': 'Low', 'emoji': '😔'},
      {'key': 'bad', 'label': 'Bad', 'emoji': '😫'},
    ];

    return _buildCardWrapper(
      stepNumber: '01',
      title: 'Your mood',
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: moods.map((m) {
          final isSelected = _selectedMood == m['key'];
          return ChoiceChip(
            label: Text('${m['emoji']} ${m['label']}'),
            selected: isSelected,
            selectedColor: const Color(0xFFEADBFF),
            onSelected: (val) {
              if (val) setState(() => _selectedMood = m['key'] as String);
            },
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSleepSection() {
    final hourPills = [4.0, 5.0, 6.0, 7.0, 8.0, 9.0];
    final qualities = ['poor', 'fair', 'good', 'excellent'];

    return _buildCardWrapper(
      stepNumber: '02',
      title: 'Sleep & recovery',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('HOURS SLEPT: ${_sleepHours.toStringAsFixed(1)} h', style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: hourPills.map((h) {
              final isSelected = _sleepHours == h;
              return ChoiceChip(
                label: Text('${h.toInt()}h'),
                selected: isSelected,
                selectedColor: const Color(0xFF6B4FA0),
                labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
                onSelected: (val) {
                  if (val) setState(() => _sleepHours = h);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          const Text('How well did you sleep?', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: qualities.map((q) {
              final isSelected = _selectedSleepQuality == q;
              return ChoiceChip(
                label: Text(q.toUpperCase()),
                selected: isSelected,
                selectedColor: const Color(0xFFEADBFF),
                onSelected: (val) {
                  if (val) setState(() => _selectedSleepQuality = q);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildEnergyAndStressSection() {
    return _buildCardWrapper(
      stepNumber: '03',
      title: 'Energy & Stress levels',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Energy Level: ${_energyLevel.toInt()}/10', style: const TextStyle(fontWeight: FontWeight.w600)),
          Slider(
            value: _energyLevel,
            min: 1,
            max: 10,
            divisions: 9,
            activeColor: const Color(0xFF6B4FA0),
            onChanged: (v) => setState(() => _energyLevel = v),
          ),
          const SizedBox(height: 12),
          Text('Stress Level: ${_stressLevel.toInt()}/5', style: const TextStyle(fontWeight: FontWeight.w600)),
          Slider(
            value: _stressLevel,
            min: 1,
            max: 5,
            divisions: 4,
            activeColor: const Color(0xFF6B4FA0),
            onChanged: (v) => setState(() => _stressLevel = v),
          ),
        ],
      ),
    );
  }

  Widget _buildSorenessSection() {
    final levels = [
      {'val': 1, 'label': 'None'},
      {'val': 2, 'label': 'Mild'},
      {'val': 3, 'label': 'Moderate'},
      {'val': 4, 'label': 'High'},
      {'val': 5, 'label': 'Severe'},
    ];

    return _buildCardWrapper(
      stepNumber: '04',
      title: 'Muscle soreness',
      child: Wrap(
        spacing: 8,
        children: levels.map((l) {
          final isSelected = _sorenessLevel == l['val'];
          return ChoiceChip(
            label: Text('${l['val']} ${l['label']}'),
            selected: isSelected,
            selectedColor: const Color(0xFFEADBFF),
            onSelected: (val) {
              if (val) setState(() => _sorenessLevel = l['val'] as int);
            },
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCardWrapper({required String stepNumber, required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0ECF9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(stepNumber, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF6B4FA0))),
              ),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}