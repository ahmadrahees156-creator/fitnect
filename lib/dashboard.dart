import 'package:flutter/material.dart';
import 'sidebar.dart';
import 'profile.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFFF7F5FA);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        // Three lines drawer trigger on the top-left
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.black87),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('FitNect', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Overview', style: TextStyle(color: Colors.black54, fontSize: 11)),
          ],
        ),
        actions: [
          // Profile Avatar Icon on the top-right
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                );
              },
              child: Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFFFCC80),
                ),
                alignment: Alignment.center,
                child: const Text('A', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87, fontSize: 14)),
              ),
            ),
          ),
        ],
      ),
      drawer: const SidebarDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Wellness Check-in Welcome Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFE8DEF8),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'YOUR PERSONAL WELLNESS SPACE',
                    style: TextStyle(color: Color(0xFF49454F), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Welcome back, amy.\nLet\'s check in with your body.',
                    style: TextStyle(color: Colors.black, fontSize: 24, fontWeight: FontWeight.w900, height: 1.2),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Track your wellness, understand your recovery, and build healthier training habits one day at a time.',
                    style: TextStyle(color: Colors.black54, fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    ),
                    child: const Text('Start wellness check-in', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 20),
                  Center(
                    child: Image.asset(
                      'assets/logo.png', // Or your runner illustration asset
                      height: 180,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.directions_run, size: 100, color: Color(0xFF8E24AA)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}