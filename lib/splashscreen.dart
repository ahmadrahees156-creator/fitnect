import 'dart:async';
import 'package:fitnect/onboarding_screen.dart';
import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  
  double _logoScale = 2.5;
  
  bool _showText = false;

  @override
  void initState() {
    super.initState();

    
    Timer(const Duration(milliseconds: 100), () {
      if (mounted) {
        setState(() {
          _logoScale = 1.0; 
        });
      }
    });

    
    Timer(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _showText = true;
        });
      }
    });

    
    Timer(const Duration(seconds: 3, milliseconds: 500), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const OnboardingScreen(), 
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, 
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            
            AnimatedScale(
              scale: _logoScale,
              duration: const Duration(milliseconds: 1000), 
              curve: Curves.easeOutCubic, 
              child: Image.asset(
                'assets/logo.png',
                height: 120,
              ),
            ),
            const SizedBox(height: 36), 

            
            AnimatedOpacity(
              opacity: _showText ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 600), 
              child: const Text(
                'FITNECT',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 36,
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 4.0, 
                  
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Temporary placeholder home screen for testing
class PlaceholderHomeScreen extends StatelessWidget {
  const PlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fitnect Home')),
      body: const Center(
        child: Text('Splash screen sequence complete!'),
      ),
    );
  }
}