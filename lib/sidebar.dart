import 'package:flutter/material.dart';
import 'profile.dart';
import 'signin_screen.dart';

class SidebarDrawer extends StatelessWidget {
  const SidebarDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF8E24AA);

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Text('F', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: primaryPurple)),
                      Text('FitNect.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.black54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE0E0E0)),
            
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Text('WORKSPACE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black45, letterSpacing: 1.2)),
                  ),
                  _buildDrawerItem(context, 'Overview', true, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Wellness Check-in', false, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Training & Activity', false, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Footsteps', false, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Injury Risk', false, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Recovery', false, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Nutrition', false, () => Navigator.pop(context)),
                  _buildDrawerItem(context, 'Profile', false, () {
                    Navigator.pop(context); 
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
                  }),
                  _buildDrawerItem(context, 'Settings', false, () => Navigator.pop(context)),
                ],
              ),
            ),

            const Divider(height: 1, color: Color(0xFFE0E0E0)),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: TextButton.icon(
                onPressed: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (context) => const SignInScreen()),
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.logout, color: Colors.redAccent, size: 18),
                label: const Text('Log out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(BuildContext context, String title, bool isSelected, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFFEFE8F6) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? const Color(0xFF8E24AA) : Colors.black87,
          ),
        ),
        onTap: onTap,
        dense: true,
      ),
    );
  }
}