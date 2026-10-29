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
            if (w['notes'] != null) {
              _notesController.text = w['notes'];
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching wellness: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
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

      if (!mounted) return;
      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Wellness check-in saved successfully!')),
        );
        _fetchTodayWellness();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: ${response.statusCode}')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
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
          'FitNect\nWellness Check-in',
          style: TextStyle(color: Color.fromARGB(136, 10, 9, 9), fontSize: 12, height: 1.2),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6B4FA0)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: Colors.purple.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 6),
                            const Text('YOUR DAILY RESET', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Check in with\nyourself.',
                          style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Color(0xFF1E1B2E), height: 1.1),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'A little awareness goes a long way. Track how you feel, how you recover, and what your body needs today.',
                          style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF8FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFEADBFF).withValues(alpha: 0.5)),
                          ),
                          child: Row(
                            children: const [
                              Text('😊', style: TextStyle(fontSize: 20)),
                              SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Make time for you', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E1B2E))),
                                  Text('Takes about 1 minute', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFAF8FF),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE8F5E9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('Wellness journal', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF2E7D32))),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  
                  _buildSectionCard(
                    step: '01',
                    title: 'Your mood',
                    subtitle: 'How has today been feeling so far?',
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(child: _buildMoodTile('great', 'Great', '😄', 'Feeling amazing')),
                            const SizedBox(width: 8),
                            Expanded(child: _buildMoodTile('good', 'Good', '🙂', 'Doing well')),
                            const SizedBox(width: 8),
                            Expanded(child: _buildMoodTile('okay', 'Okay', '😐', 'Just doing ok')),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildMoodTile('low', 'Low', '😔', 'Need some rest')),
                            const SizedBox(width: 8),
                            Expanded(child: _buildMoodTile('bad', 'Bad', '😫', 'Rough day')),
                            const SizedBox(width: 8),
                            const Expanded(child: SizedBox()), 
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildSectionCard(
                    step: '02',
                    title: 'Sleep & recovery',
                    subtitle: 'Rest is part of your progress',
                    trailingIcon: Icons.nightlight_round,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF8FF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('HOURS SLEPT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Text('${_sleepHours.toInt()}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 4),
                                  const Text('hours', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [4.0, 5.0, 6.0, 7.0, 8.0, 9.0].map((h) {
                                  final isSelected = _sleepHours == h;
                                  return GestureDetector(
                                    onTap: () => setState(() => _sleepHours = h),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isSelected ? const Color(0xFF6B4FA0) : Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        '${h.toInt()}h',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected ? Colors.white : Colors.black87,
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text('How well did you sleep?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87)),
                        const SizedBox(height: 8),
                        Row(
                          children: ['poor', 'fair', 'good', 'excellent'].map((q) {
                            final isSelected = _selectedSleepQuality == q;
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 2.0),
                                child: GestureDetector(
                                  onTap: () => setState(() => _selectedSleepQuality = q),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: isSelected ? const Color(0xFFEADBFF) : Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: isSelected ? const Color(0xFF6B4FA0) : Colors.grey.shade300),
                                    ),
                                    child: Text(
                                      q[0].toUpperCase() + q.substring(1),
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isSelected ? const Color(0xFF6B4FA0) : Colors.black87),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildSectionCard(
                    step: '03',
                    title: 'Energy levels',
                    subtitle: 'Tune in to the energy you have.',
                    trailingIcon: Icons.wb_sunny_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF8EE), 
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Your current energy', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.orange.shade100, borderRadius: BorderRadius.circular(6)),
                                    child: Text('${_energyLevel.toInt()}/10', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.orange)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              const Text('Energy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              Slider(
                                value: _energyLevel,
                                min: 1,
                                max: 10,
                                divisions: 9,
                                activeColor: Colors.orange,
                                inactiveColor: Colors.orange.shade100,
                                onChanged: (v) => setState(() => _energyLevel = v),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: const [
                                  Text('Running low', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                  Text('Full of energy', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text('Stress', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        Slider(
                          value: _stressLevel,
                          min: 1,
                          max: 5,
                          divisions: 4,
                          activeColor: const Color(0xFF6B4FA0),
                          inactiveColor: const Color(0xFFEADBFF),
                          onChanged: (v) => setState(() => _stressLevel = v),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            Text('Calm', style: TextStyle(fontSize: 10, color: Colors.grey)),
                            Text('Very stressed', style: TextStyle(fontSize: 10, color: Colors.grey)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildSectionCard(
                    step: '04',
                    title: 'Muscle soreness',
                    subtitle: 'How is your body feeling after movement or training?',
                    trailingIcon: Icons.spa_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Current soreness', style: TextStyle(fontSize: 11, color: Colors.grey)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(6)),
                              child: Text(_getSorenessLabel(_sorenessLevel), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _buildSorenessTile(1, 'None'),
                            const SizedBox(width: 4),
                            _buildSorenessTile(2, 'Mild'),
                            const SizedBox(width: 4),
                            _buildSorenessTile(3, 'Moderate'),
                            const SizedBox(width: 4),
                            _buildSorenessTile(4, 'High'),
                            const SizedBox(width: 4),
                            _buildSorenessTile(5, 'Severe'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: const Color(0xFFE8F5E9), borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.check, size: 16, color: Color(0xFF2E7D32)),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text('One minute for your wellbeing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                            Text('Your responses will be saved to your recovery journal', style: TextStyle(fontSize: 10, color: Colors.grey)),
                          ],
                        ),
                        const Spacer(),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E1B2E),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          onPressed: _isSaving ? null : _submitWellnessCheckIn,
                          child: _isSaving
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Save check-in', style: TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionCard({required String step, required String title, required String subtitle, IconData? trailingIcon, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.purple.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFF0ECF9), borderRadius: BorderRadius.circular(6)),
                    child: Text(step, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF6B4FA0))),
                  ),
                  const SizedBox(width: 8),
                  Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E1B2E))),
                ],
              ),
              if (trailingIcon != null) Icon(trailingIcon, size: 16, color: Colors.amber.shade400),
            ],
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildMoodTile(String key, String label, String emoji, String desc) {
    final isSelected = _selectedMood == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedMood = key),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFAF8FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? const Color(0xFF6B4FA0) : Colors.grey.shade200, width: isSelected ? 1.5 : 1),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1E1B2E))),
            Text(desc, style: const TextStyle(fontSize: 9, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildSorenessTile(int val, String label) {
    final isSelected = _sorenessLevel == val;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _sorenessLevel = val),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFE8F5E9) : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade200),
          ),
          child: Column(
            children: [
              Text('$val', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isSelected ? const Color(0xFF2E7D32) : Colors.black87)),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 9, color: isSelected ? const Color(0xFF2E7D32) : Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }

  String _getSorenessLabel(int level) {
    switch (level) {
      case 1: return 'None';
      case 2: return 'Mild';
      case 3: return 'Moderate';
      case 4: return 'High';
      case 5: return 'Severe';
      default: return 'Mild';
    }
  }
}