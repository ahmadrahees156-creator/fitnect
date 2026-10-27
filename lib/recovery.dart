import 'package:flutter/material.dart';

class RecoveryScreen extends StatelessWidget {
  const RecoveryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFFF7F5FA);
    const primaryPurple = Color(0xFF8E24AA);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Recovery & Regeneration', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('RECOVERY STATUS', style: TextStyle(color: primaryPurple, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
            const SizedBox(height: 4),
            const Text('Readiness & Regeneration', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.black)),
            const SizedBox(height: 6),
            const Text('Track your physical adaptation, sleep architecture, and daily energy reserves.', style: TextStyle(fontSize: 13, color: Colors.black54)),
            const SizedBox(height: 24),

            // Recovery Score Banner Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4A148C), primaryPurple],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween, 
                    children: const [
                      Text('OVERALL RECOVERY SCORE', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                      Icon(Icons.bolt, color: Color(0xFFFFCC80)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('84%', style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  const Text('Optimal condition. Your somatic recovery metrics support high-intensity workouts today.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Metrics Breakdown Section
            const Text('Recovery Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 16),

            _buildMetricTile('Sleep Duration', '7.5 hrs', 'Deep sleep stable at 2h 15m', Icons.nightlight_round),
            const SizedBox(height: 12),
            _buildMetricTile('Resting Heart Rate', '58 bpm', 'Within normal baseline range', Icons.favorite),
            const SizedBox(height: 12),
            _buildMetricTile('Soreness Level', 'Minimal', 'Lower body fully recovered', Icons.fitness_center),
            const SizedBox(height: 12),
            _buildMetricTile('Hydration Level', '2,400 ml', 'Daily target achieved', Icons.water_drop),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(String title, String value, String subtitle, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFE8DEF8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFF8E24AA)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: Colors.black54, fontSize: 12)),
              ],
            ),
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF8E24AA))),
        ],
      ),
    );
  }
}