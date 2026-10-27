import 'package:flutter/material.dart';

class ProfileScreen extends StatefulWidget {
  final String userName;
  final String userEmail;

  const ProfileScreen({
    super.key,
    required this.userName,
    required this.userEmail,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _heightController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  
  String _selectedFitnessLevel = 'Beginner';
  String _selectedGoal = 'Build strength';

  @override
  void initState() {
    super.initState();
    
    _nameController = TextEditingController(text: widget.userName);
    _emailController = TextEditingController(text: widget.userEmail);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFFF7F5FA);
    const primaryPurple = Color(0xFF8E24AA);

    
    final String initialLetter = widget.userName.isNotEmpty 
        ? widget.userName[0].toUpperCase() 
        : 'U';

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              
              OutlinedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back, size: 16, color: Colors.black87),
                label: const Text('Back to dashboard', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFFE0E0E0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),

              const Text(
                'YOUR ACCOUNT',
                style: TextStyle(color: primaryPurple, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
              const SizedBox(height: 4),
              const Text(
                'My Profile',
                style: TextStyle(color: Colors.black, fontSize: 28, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              const Text(
                'Manage your personal details and fitness preferences.',
                style: TextStyle(color: Colors.black54, fontSize: 13),
              ),
              const SizedBox(height: 20),

              
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4A148C), Color(0xFF8E24AA)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white70, width: 2),
                            color: const Color(0xFFFFCC80),
                          ),
                          alignment: Alignment.center,
                          child: Text(initialLetter, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('FITNESS MEMBER', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                              const SizedBox(height: 2),
                              Text(_nameController.text, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                              Text(_emailController.text, style: const TextStyle(color: Colors.white70, fontSize: 12), overflow: TextOverflow.ellipsis),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.circle, size: 8, color: Colors.greenAccent),
                          SizedBox(width: 6),
                          Text('Athlete', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              
              const Text('Personal information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
              const Text('Your basic account details.', style: TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 16),

              _buildTextField('Full name', _nameController, false),
              const SizedBox(height: 14),
              _buildTextField('Email address', _emailController, false),
              const SizedBox(height: 14),
              _buildTextField('Age', _ageController, true, hint: 'Your age'),
              const SizedBox(height: 14),
              _buildTextField('Height (cm)', _heightController, true, hint: 'e.g. 175'),
              const SizedBox(height: 14),
              _buildTextField('Weight (kg)', _weightController, true, hint: 'e.g. 70'),
              const SizedBox(height: 14),

              
              const Text('Fitness level', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE0E0E0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedFitnessLevel,
                    isExpanded: true,
                    items: ['Beginner', 'Intermediate', 'Advanced']
                        .map((level) => DropdownMenuItem(value: level, child: Text(level)))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedFitnessLevel = val!),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              
              const Text('Fitness preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
              const Text('Choose the goal you want to focus on.', style: TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 16),

              _buildGoalCard('Build strength', 'Get stronger every day', '💪'),
              const SizedBox(height: 12),
              _buildGoalCard('Lose weight', 'Work towards your target', '🎯'),
              const SizedBox(height: 12),
              _buildGoalCard('Improve endurance', 'Build stamina and energy', '🏃'),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, bool isNumber, {String? hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
          ),
        ),
      ],
    );
  }

  Widget _buildGoalCard(String title, String subtitle, String emoji) {
    bool isSelected = _selectedGoal == title;
    return GestureDetector(
      onTap: () => setState(() => _selectedGoal = title),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF8E24AA) : const Color(0xFFE0E0E0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
                  Text(subtitle, style: const TextStyle(color: Colors.black54, fontSize: 12)),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: Color(0xFF8E24AA)),
          ],
        ),
      ),
    );
  }
}