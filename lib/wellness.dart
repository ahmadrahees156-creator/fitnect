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
  
  String _selectedMood = 'good';
  double _energyLevel = 7.0;
  double _sleepHours = 7.5;
  String _selectedSleepQuality = 'good';
  double _stressLevel = 2.0;
  double _sorenessLevel = 2.0;
  final _notesController = TextEditingController();

  bool _isLoading = false;

  final List<Map<String, String>> _moods = [
    {'label': 'Great', 'value': 'great'},
    {'label': 'Good', 'value': 'good'},
    {'label': 'Okay', 'value': 'okay'},
    {'label': 'Low', 'value': 'low'},
    {'label': 'Bad', 'value': 'bad'},
  ];

  final List<Map<String, String>> _sleepQualities = [
    {'label': 'Poor', 'value': 'poor'},
    {'label': 'Fair', 'value': 'fair'},
    {'label': 'Good', 'value': 'good'},
    {'label': 'Excellent', 'value': 'excellent'},
  ];

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitWellnessCheckIn() async {
    setState(() => _isLoading = true);

    final url = Uri.parse('https://fitnect.onrender.com/api/wellness');

    final Map<String, dynamic> body = {
      "mood": _selectedMood,
      "energy": _energyLevel.toInt(),
      "sleepHours": _sleepHours,
      "sleepQuality": _selectedSleepQuality,
      "stress": _stressLevel.toInt(),
      "soreness": _sorenessLevel.toInt(),
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

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Wellness check-in saved successfully!')),
          );
          Navigator.pop(context);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save check-in: Status ${response.statusCode}')),
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
        title: const Text('Wellness Check-in'),
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
                  colors: [Color(0xFFEEDCF8), Color(0xFFFCE4EC)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Check in with yourself.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
                  SizedBox(height: 6),
                  Text('A little awareness goes a long way. Track how you feel, how you recover, and what your body needs today.', style: TextStyle(fontSize: 12, color: Colors.black54)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            
            _buildSectionCard(
              title: 'Your mood',
              subtitle: 'How has today been feeling so far?',
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: _moods.map((m) {
                  bool isSelected = _selectedMood == m['value'];
                  return GestureDetector(
                    onTap: () => setState(() => _selectedMood = m['value']!),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFEEDCF8) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isSelected ? const Color(0xFF8E24AA) : Colors.transparent),
                      ),
                      child: Column(
                        children: [
                          const Text('😊', style: TextStyle(fontSize: 24)),
                          const SizedBox(height: 4),
                          Text(m['label']!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF8E24AA) : Colors.black87)),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            
            _buildSectionCard(
              title: 'Sleep & recovery',
              subtitle: 'Rest is part of your progress.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('HOURS SLEPT: ${_sleepHours.toStringAsFixed(1)} hours', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                  Slider(
                    value: _sleepHours,
                    min: 0,
                    max: 12,
                    divisions: 24,
                    activeColor: const Color(0xFF8E24AA),
                    onChanged: (val) => setState(() => _sleepHours = val),
                  ),
                  const SizedBox(height: 12),
                  const Text('How well did you sleep?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _sleepQualities.map((sq) {
                      bool isSelected = _selectedSleepQuality == sq['value'];
                      return ChoiceChip(
                        label: Text(sq['label']!),
                        selected: isSelected,
                        selectedColor: const Color(0xFFEEDCF8),
                        onSelected: (bool selected) {
                          setState(() => _selectedSleepQuality = sq['value']!);
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            
            _buildSectionCard(
              title: 'Energy levels & stress',
              subtitle: 'Tune into the energy you have.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Current energy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      Text('${_energyLevel.toInt()} / 10', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF8E24AA))),
                    ],
                  ),
                  Slider(
                    value: _energyLevel,
                    min: 1,
                    max: 10,
                    divisions: 9,
                    activeColor: const Color(0xFF8E24AA),
                    onChanged: (val) => setState(() => _energyLevel = val),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Stress level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      Text('${_stressLevel.toInt()} / 5', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange)),
                    ],
                  ),
                  Slider(
                    value: _stressLevel,
                    min: 1,
                    max: 5,
                    divisions: 4,
                    activeColor: Colors.orange,
                    onChanged: (val) => setState(() => _stressLevel = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            
            _buildSectionCard(
              title: 'Muscle soreness',
              subtitle: 'How is your body feeling after movement?',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Soreness level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      Text('${_sorenessLevel.toInt()} / 5', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.redAccent)),
                    ],
                  ),
                  Slider(
                    value: _sorenessLevel,
                    min: 1,
                    max: 5,
                    divisions: 4,
                    activeColor: Colors.redAccent,
                    onChanged: (val) => setState(() => _sorenessLevel = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

          
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Notes (optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Anything you want to remember about how you feel...',
                      filled: true,
                      fillColor: const Color(0xFFFAFAFA),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            
            ElevatedButton(
              onPressed: _isLoading ? null : _submitWellnessCheckIn,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8E24AA),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Save check-in', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String title, required String subtitle, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}