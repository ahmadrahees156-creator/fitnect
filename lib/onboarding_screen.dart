import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'login.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNextPage() {
    if (_currentPage < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const SignUpScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    
    const backgroundColor = Color(0xFFEFE8F6);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            
            Expanded(
              child: ScrollConfiguration(
                behavior: ScrollConfiguration.of(context).copyWith(
                  dragDevices: {
                    PointerDeviceKind.touch,
                    PointerDeviceKind.mouse,
                    PointerDeviceKind.trackpad,
                  },
                ),
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() {
                      _currentPage = index;
                    });
                  },
                  children: const [
                    _SlideOne(),
                    _SlideTwo(),
                    _SlideThree(), 
                    _SlideFour(),  
                  ],
                ),
              ),
            ),

            
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                4,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4.0),
                  height: 8.0,
                  width: _currentPage == index ? 24.0 : 8.0,
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? const Color(0xFF6C4AB6)
                        : Colors.black12,
                    borderRadius: BorderRadius.circular(4.0),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20.0),

            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _onNextPage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    _currentPage == 3 ? 'GET STARTED' : 'CONTINUE',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SlideOne extends StatelessWidget {
  const _SlideOne();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.circle, size: 8, color: Color.fromARGB(255, 189, 40, 134)),
              SizedBox(width: 8),
              Text(
                'ATHLETE WELLNESS, REIMAGINED',
                style: TextStyle(
                  color: Color(0xFF8E24AA),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Listen\nto your',
            style: TextStyle(
              color: Colors.black,
              fontSize: 48,
              height: 1.1,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          
          Stack(
            clipBehavior: Clip.none,
            children: [
              
              Positioned(
                bottom: 4,
                left: 0,
                child: Container(
                  height: 12,
                  width: 140,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFCC80), 
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
              
              const Text(
                'body',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 48,
                  height: 1.1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              
              Positioned(
                bottom: 8,
                right: -16,
                child: Container(
                  height: 10,
                  width: 10,
                  decoration: const BoxDecoration(
                    color: Color(0xFF6C4AB6), 
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Performance is more than what happens during a workout. '
            'Understand your wellness, training and recovery as parts of one bigger picture.',
            style: TextStyle(
              color: Colors.black87,
              fontSize: 16,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}


class _SlideTwo extends StatelessWidget {
  const _SlideTwo();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: const TextSpan(
              style: TextStyle(
                color: Colors.black,
                fontSize: 40,
                fontWeight: FontWeight.w900,
                height: 1.1,
              ),
              children: [
                TextSpan(text: 'You are\n'),
                TextSpan(
                  text: 'not just\n',
                  style: TextStyle(color: Color(0xFF8E24AA)),
                ),
                TextSpan(text: 'your stats.'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Your sleep. Your energy. Your training. Your recovery. They all belong in the same conversation.',
            style: TextStyle(
              color: Colors.black,
              fontSize: 18,
              fontWeight: FontWeight.w600,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Fitnect brings these data streams together to help athletes develop a deeper understanding of their readiness, instead of chasing a single score.',
            style: TextStyle(
              color: Colors.black54,
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 36),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: const [
              _PillarItem(color: Colors.greenAccent, label: 'Notice'),
              _PillarItem(color: Colors.lightBlueAccent, label: 'Connect'),
              _PillarItem(color: Colors.amberAccent, label: 'Reflect'),
              _PillarItem(color: Colors.pinkAccent, label: 'Adapt'),
            ],
          ),
        ],
      ),
    );
  }
}

class _PillarItem extends StatelessWidget {
  final Color color;
  final String label;

  const _PillarItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: color,
          child: Text(
            label[0],
            style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ],
    );
  }
}


class _SlideThree extends StatelessWidget {
  const _SlideThree();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.circle, size: 8, color: Color(0xFF8E24AA)),
              SizedBox(width: 8),
              Text(
                'A SIMPLE PRACTICE',
                style: TextStyle(
                  color: Color(0xFF8E24AA),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          RichText(
            text: const TextSpan(
              style: TextStyle(
                color: Colors.black,
                fontSize: 32,
                fontWeight: FontWeight.w900,
                height: 1.1,
              ),
              children: [
                TextSpan(text: 'Small check-ins.\n'),
                TextSpan(
                  text: 'Bigger picture.',
                  style: TextStyle(color: Color(0xFF8E24AA)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'A straightforward process designed around everyday athlete wellness, not complicated dashboards.',
            style: TextStyle(color: Colors.black54, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 24),

          _buildStepRow(
            badgeText: '01',
            badgeColor: Colors.greenAccent,
            title: 'Check in with yourself.',
            subtitle: 'Record how you feel, how you slept, how your body is recovering.',
          ),
          const SizedBox(height: 14),
          _buildStepRow(
            badgeText: '02',
            badgeColor: Colors.lightBlueAccent,
            title: 'Connect the signals.',
            subtitle: 'Bring wellness and training information together to understand patterns.',
          ),
          const SizedBox(height: 14),
          _buildStepRow(
            badgeText: '03',
            badgeColor: Colors.amberAccent,
            title: 'Make informed decisions.',
            subtitle: 'Use the bigger picture to guide thoughts, training and recovery choices.',
          ),
        ],
      ),
    );
  }

  Widget _buildStepRow({
    required String badgeText,
    required Color badgeColor,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: badgeColor,
            child: Text(
              badgeText,
              style: const TextStyle(
                color: Colors.black,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black54,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


class _SlideFour extends StatelessWidget {
  const _SlideFour();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            height: 160,
            width: 160,
            decoration: BoxDecoration(
              color: Colors.purple.shade100,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.directions_run_rounded,
              size: 90,
              color: Color(0xFF6C4AB6),
            ),
          ),
          const SizedBox(height: 36),
          const Text(
            "You're all set.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black,
              fontSize: 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Connect your sensors, set your recovery goals, and start listening to your body. Your journey to optimized performance begins now.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black87,
              fontSize: 15,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}


class PlaceholderHomeScreen extends StatelessWidget {
  const PlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fitnect Home')),
      body: const Center(
        child: Text('Welcome to Fitnect!'),
      ),
    );
  }
}