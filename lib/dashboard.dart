import 'package:flutter/material.dart';
import 'sidebar.dart';
import 'profile.dart';

class DashboardScreen extends StatelessWidget {
  final String userName;
  final String userEmail;
  final String token;
  final int age;
  final double height;
  final double weight;
  final double bmi;

  const DashboardScreen({
    super.key,
    this.userName = 'Athlete',
    this.userEmail = '',
    this.token = '',
    this.age = 0,
    this.height = 0.0,
    this.weight = 0.0,
    this.bmi = 0.0,
  });

  String _getBmiCategory(double value) {
    if (value < 18.5) return 'Underweight';
    if (value < 25.0) return 'Normal weight';
    if (value < 30.0) return 'Overweight';
    return 'Obese';
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFFF7F5FA);
    final String initialLetter = userName.isNotEmpty ? userName[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
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
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ProfileScreen(
                      userName: userName,
                      userEmail: userEmail,
                    
                    ),
                  ),
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
                child: Text(initialLetter, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87, fontSize: 14)),
              ),
            ),
          ),
        ],
      ),
      drawer: SidebarDrawer(userName: userName, userEmail: userEmail, token: token,),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            
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
                  Text(
                    'Welcome back, ${userName.toLowerCase()}.\nLet\'s check in with your body.',
                    style: const TextStyle(color: Colors.black, fontSize: 24, fontWeight: FontWeight.w900, height: 1.2),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Track your wellness, understand your recovery, and build healthier training habits one day at a time.',
                    style: TextStyle(color: Colors.black54, fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 20),

                  
                  if (bmi > 0)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('BODY MASS INDEX (BMI)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1)),
                              const SizedBox(height: 4),
                              Text(bmi.toStringAsFixed(1), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF8E24AA))),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFCC80),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(_getBmiCategory(bmi), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),

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
                      'assets/logo.png',
                      height: 160,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.directions_run, size: 90, color: Color(0xFF8E24AA)),
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