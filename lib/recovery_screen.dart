import 'package:flutter/material.dart';
import 'recovery_logic.dart';

class RecoveryScreen extends StatefulWidget {
  final String token;
  const RecoveryScreen({super.key, required this.token});

  @override
  State<RecoveryScreen> createState() => _RecoveryScreenState();
}

class _RecoveryScreenState extends State<RecoveryScreen> {
  bool _isLoading = false;

  String _selectedMood = 'good';
  String _selectedSleepQuality = 'good';
  final _sleepHoursController = TextEditingController(text: '8');
  double _energyLevel = 5.0;
  double _muscleSoreness = 2.0;
  double _stressLevel = 2.0;
  final _notesController = TextEditingController();

  double _todaySleepHours = 8.0;
  double _todayEnergyLevel = 5.0;
  final int _checkInScore = 63;
  List<dynamic> _historyEntries = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final todayData = await RecoveryLogic.fetchTodayRecovery(widget.token);
    final historyData = await RecoveryLogic.fetchRecoveryHistory(widget.token);

    if (!mounted) return;
    setState(() {
      if (todayData.isNotEmpty) {
        _selectedMood = todayData['mood'] ?? 'good';
        _selectedSleepQuality = todayData['sleepQuality'] ?? 'good';
        _todaySleepHours = (todayData['sleepHours'] ?? 8.0).toDouble();
        _todayEnergyLevel = (todayData['energy'] ?? 5.0).toDouble();
        _energyLevel = _todayEnergyLevel;
        _stressLevel = (todayData['stress'] ?? 2.0).toDouble();
        _muscleSoreness = (todayData['soreness'] ?? 2.0).toDouble();
        _sleepHoursController.text = _todaySleepHours.toString();
        if (todayData['notes'] != null) {
          _notesController.text = todayData['notes'];
        }
      }
      _historyEntries = historyData;
    });
  }

  Future<void> _handleSave() async {
    setState(() => _isLoading = true);
    final body = {
      "date": DateTime.now().toIso8601String().split('T')[0],
      "mood": _selectedMood,
      "energy": _energyLevel.toInt(),
      "sleepHours": double.tryParse(_sleepHoursController.text) ?? 8.0,
      "sleepQuality": _selectedSleepQuality,
      "stress": _stressLevel.toInt(),
      "soreness": _muscleSoreness.toInt(),
      "notes": _notesController.text.trim(),
    };

    bool success = await RecoveryLogic.saveRecoveryCheckIn(widget.token, body);
    if (!mounted) return;

    setState(() => _isLoading = false);
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Recovery check-in saved successfully!')),
      );
      _loadData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save check-in')),
      );
    }
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
        title: const Text('FitNect\nRecovery', style: TextStyle(color: Colors.black54, fontSize: 12, height: 1.2)),
        actions: [
          const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              backgroundColor: Color(0xFF10B981),
              radius: 14,
              child: Text('A', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFEDE9FE), Color(0xFFFCE7F3)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('RECOVERY & REST', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 6),
                  const Text('Progress needs recovery.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 6),
                  const Text('Reflect on your sleep, mood, energy and muscle soreness before deciding how hard to train today.', style: TextStyle(fontSize: 10, color: Colors.black54)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                        child: Text(DateTime.now().toIso8601String().split('T')[0], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(10)),
                        child: const Text('Daily recovery check-in', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: _buildMetricCard('Sleep duration', '${_todaySleepHours.toStringAsFixed(1)} hrs', 'Your average sleep', Icons.nightlight_round, Colors.indigo),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildMetricCard('Energy level', '${_todayEnergyLevel.toStringAsFixed(0)} / 10', 'How energetic you feel', Icons.bolt, Colors.orange),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildScoreCard('Check-in score', '$_checkInScore / 100'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DAILY REFLECTION', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  const Text('How recovered do you feel?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Record how you feel today. Your check-in is saved to your FitNect account.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  const SizedBox(height: 16),

                  const Text('How is your mood?', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedMood,
                        isExpanded: true,
                        items: ['great', 'good', 'okay', 'low', 'bad'].map((m) {
                          return DropdownMenuItem(value: m, child: Text(m.toUpperCase(), style: const TextStyle(fontSize: 12)));
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedMood = val ?? 'good'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  const Text('Sleep last night (hours)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _sleepHoursController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 12),

                  const Text('Sleep quality', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedSleepQuality,
                        isExpanded: true,
                        items: ['poor', 'fair', 'good', 'excellent'].map((q) {
                          return DropdownMenuItem(value: q, child: Text(q.toUpperCase(), style: const TextStyle(fontSize: 12)));
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedSleepQuality = val ?? 'good'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildSlider('Energy level', _energyLevel, 1, 10, (val) => setState(() => _energyLevel = val), 'Very low', 'Excellent'),
                  const SizedBox(height: 12),
                  _buildSlider('Muscle soreness', _muscleSoreness, 1, 5, (val) => setState(() => _muscleSoreness = val), 'None', 'Very sore'),
                  const SizedBox(height: 12),
                  _buildSlider('Stress level', _stressLevel, 1, 5, (val) => setState(() => _stressLevel = val), 'Relaxed', 'Very stressed'),
                  const SizedBox(height: 16),

                  const Text('Notes (optional)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Anything affecting your recovery today?',
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      contentPadding: const EdgeInsets.all(12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2C1E4A), padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      onPressed: _isLoading ? null : _handleSave,
                      child: const Text('Save recovery check-in', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFEDE9FE), Color(0xFFFCE7F3)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('YOUR REFLECTION', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  const Text('Take it steady', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  const Text('Consider a comfortable session and monitor how you feel. Reduce intensity if you are unusually tired or sore.', style: TextStyle(fontSize: 11, color: Colors.black87)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(10)),
                    child: const Text('This check-in is a simple demonstration calculated from your answers. It is not a validated recovery metric or medical advice.', style: TextStyle(fontSize: 9, color: Colors.black54)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text('RECOVERY HABITS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 4),
            const Text('Small steps, better routines', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildHabitCard('Prioritize sleep', 'Keep a consistent sleep schedule and allow enough time to rest.', Icons.nightlight_round),
            const SizedBox(height: 8),
            _buildHabitCard('Gentle movement', 'Try easy walking or comfortable mobility work on sore days.', Icons.directions_walk),
            const SizedBox(height: 8),
            _buildHabitCard('Stay hydrated', 'Drink water regularly and adjust to your activity and conditions.', Icons.water_drop),
            const SizedBox(height: 24),

            const Text('PAST CHECK-INS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 4),
            const Text('Your recovery history', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _historyEntries.isEmpty
                ? const Text('No past check-ins found', style: TextStyle(color: Colors.grey, fontSize: 11))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _historyEntries.length,
                    itemBuilder: (context, index) {
                      final item = _historyEntries[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(item['date'] ?? 'Date', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                            Text('Sleep: ${item['sleepHours']}h | Energy: ${item['energy']}/10', style: const TextStyle(fontSize: 10, color: Colors.grey)),
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

  Widget _buildMetricCard(String title, String value, String subtitle, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 8, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildScoreCard(String title, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
              Container(padding: const EdgeInsets.all(4), decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(6)), child: const Icon(Icons.check, size: 10, color: Colors.purple)),
            ],
          ),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          LinearProgressIndicator(value: 0.63, backgroundColor: Colors.grey.shade100, color: Colors.orange, minHeight: 4),
        ],
      ),
    );
  }

  Widget _buildSlider(String label, double value, double min, double max, ValueChanged<double> onChanged, String minText, String maxText) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            Text('${value.toInt()} / ${max.toInt()}', style: const TextStyle(fontSize: 11, color: Colors.purple, fontWeight: FontWeight.bold)),
          ],
        ),
        Slider(
          value: value,
          min: min,
          max: max,
          divisions: (max - min).toInt(),
          activeColor: const Color(0xFF6B4FA0),
          onChanged: onChanged,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(minText, style: const TextStyle(fontSize: 9, color: Colors.grey)),
            Text(maxText, style: const TextStyle(fontSize: 9, color: Colors.grey)),
          ],
        ),
      ],
    );
  }

  Widget _buildHabitCard(String title, String desc, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: const Color(0xFFEDE9FE), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 16, color: const Color(0xFF6B4FA0)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
