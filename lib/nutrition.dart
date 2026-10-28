import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class NutritionScreen extends StatefulWidget {
  final String token;
  const NutritionScreen({super.key, required this.token});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Form Controllers for Manual Logging
  final _foodNameController = TextEditingController();
  final _servingSizeController = TextEditingController(text: '1');
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedMealType = 'breakfast';
  String _selectedServingUnit = 'serving';

  // State data for dashboard overview & diary
  double _todayCalories = 0;
  double _todayProtein = 0;
  final _todayFluid = 0.15;
  List<dynamic> _loggedMeals = [];

  @override
  void initState() {
    super.initState();
    _fetchTodayNutrition();
  }

  @override
  void dispose() {
    _foodNameController.dispose();
    _servingSizeController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  // --- Fetch Today's Logged Data ---
  Future<void> _fetchTodayNutrition() async {
    final url = Uri.parse('https://fitnect.onrender.com/api/nutrition/today');
    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.token}",
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _todayCalories = (data['totals']?['calories'] ?? 0).toDouble();
          _todayProtein = (data['totals']?['protein'] ?? 0).toDouble();
          _loggedMeals = data['entries'] ?? [];
        });
      }
    } catch (_) {
      // Fallback state if offline
    }
  }

  // --- Submit Custom Meal Entry ---
  Future<void> _submitFoodItem() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final url = Uri.parse('https://fitnect.onrender.com/api/nutrition');

    final Map<String, dynamic> body = {
      "date": DateTime.now().toIso8601String().split('T')[0],
      "foodName": _foodNameController.text.trim(),
      "mealType": _selectedMealType.toLowerCase(),
      "servingSize": double.tryParse(_servingSizeController.text) ?? 1.0,
      "servingUnit": _selectedServingUnit,
      "calories": double.tryParse(_caloriesController.text) ?? 0.0,
      "protein": double.tryParse(_proteinController.text) ?? 0.0,
      "carbohydrates": double.tryParse(_carbsController.text) ?? 0.0,
      "fat": double.tryParse(_fatController.text) ?? 0.0,
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
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Meal logged successfully!')),
        );
        _formKey.currentState!.reset();
        _fetchTodayNutrition();
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to log meal: ${response.body}')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connection error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- Quick-Add / Catalogue Calculation (Nutrition Engine) ---
  Future<void> _loadMealTemplate(String foodName, int fdcId, double defaultGrams, double cals, double prot, double carbs, double fat) async {
    setState(() => _isLoading = true);
    final url = Uri.parse('https://fitnect.onrender.com/api/nutrition-engine/meal-summary');

    final Map<String, dynamic> body = {
      "items": [
        {"fdc_id": fdcId, "grams": defaultGrams}
      ]
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

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final totals = data['data']?['totals'] ?? {};
        setState(() {
          _foodNameController.text = foodName;
          _servingSizeController.text = defaultGrams.toString();
          _selectedServingUnit = 'grams';
          _caloriesController.text = (totals['calories_kcal'] ?? cals).toString();
          _proteinController.text = (totals['protein_g'] ?? prot).toString();
          _carbsController.text = (totals['carbs_g'] ?? carbs).toString();
          _fatController.text = (totals['fat_g'] ?? fat).toString();
        });
      } else {
        setState(() {
          _foodNameController.text = foodName;
          _servingSizeController.text = defaultGrams.toString();
          _caloriesController.text = cals.toString();
          _proteinController.text = prot.toString();
          _carbsController.text = carbs.toString();
          _fatController.text = fat.toString();
        });
      }
    } catch (_) {
      setState(() {
        _foodNameController.text = foodName;
        _servingSizeController.text = defaultGrams.toString();
        _caloriesController.text = cals.toString();
        _proteinController.text = prot.toString();
        _carbsController.text = carbs.toString();
        _fatController.text = fat.toString();
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7FA),
      appBar: AppBar(
        title: const Text('FitNect Nutrition', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- Header Banner Card ---
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE8DEF8), Color(0xFFFFD8E4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Fuel your body.\nFeel your best.',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Track your food, record your drinks and understand your daily intake.',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Text('${_todayCalories.toInt()} kcal', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const Text('Today\'s nutrition', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        const Divider(height: 12),
                        Text('Protein: ${_todayProtein.toInt()}g', style: const TextStyle(fontSize: 11)),
                        Text('Fluid: ${_todayFluid}L', style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 20),

            // --- Summary Cards Grid ---
            Row(
              children: [
                Expanded(child: _buildInfoCard('Calories consumed', '${_todayCalories.toInt()} kcal', Icons.local_fire_department, Colors.orange)),
                const SizedBox(width: 12),
                Expanded(child: _buildInfoCard('Protein Intake', '${_todayProtein.toInt()} g', Icons.egg, Colors.amber)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildInfoCard('Fluid intake', '$_todayFluid L', Icons.water_drop, Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _buildInfoCard('Meals logged', '${_loggedMeals.length} meals', Icons.restaurant, Colors.purple)),
              ],
            ),
            const SizedBox(height: 28),

            // --- Log Your Meal Form Section ---
            const Text('Log your meal', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Save meal details to your FitNect account.', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.grey.withValues(alpha: 0.08), blurRadius: 10, spreadRadius: 2)],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      controller: _foodNameController,
                      decoration: const InputDecoration(labelText: 'Food name', hintText: 'e.g. Paneer and roti', border: OutlineInputBorder()),
                      validator: (val) => val == null || val.isEmpty ? 'Please enter a food name' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedMealType,
                      decoration: const InputDecoration(labelText: 'Meal type', border: OutlineInputBorder()),
                      items: ['breakfast', 'lunch', 'dinner', 'snack']
                          .map((type) => DropdownMenuItem(value: type, child: Text(type[0].toUpperCase() + type.substring(1))))
                          .toList(),
                      onChanged: (val) => setState(() => _selectedMealType = val ?? 'breakfast'),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: _servingSizeController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Serving size', border: OutlineInputBorder()),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 1,
                          child: DropdownButtonFormField<String>(
                            initialValue: _selectedServingUnit,
                            decoration: const InputDecoration(labelText: 'Serving unit', border: OutlineInputBorder()),
                            items: ['serving', 'grams', 'ml', 'cup']
                                .map((unit) => DropdownMenuItem(value: unit, child: Text(unit)))
                                .toList(),
                            onChanged: (val) => setState(() => _selectedServingUnit = val ?? 'serving'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _caloriesController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Calories (kcal)', border: OutlineInputBorder()),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _proteinController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Protein (g)', border: OutlineInputBorder()),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _carbsController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Carbohydrates (g)', border: OutlineInputBorder()),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _fatController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Fat (g)', border: OutlineInputBorder()),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _notesController,
                      decoration: const InputDecoration(labelText: 'Notes (optional)', hintText: 'Anything you want to remember...', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitFoodItem,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('Save meal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // --- Meal Diary Section ---
            const Text('Meal diary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.grey.withValues(alpha: 0.08), blurRadius: 10, spreadRadius: 2)],
              ),
              child: _loggedMeals.isEmpty
                  ? Column(
                      children: [
                        const SizedBox(height: 12),
                        const Icon(Icons.eco, size: 40, color: Colors.green),
                        const SizedBox(height: 8),
                        const Text('Your meal diary is empty', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        const Text('Save your first meal to see your daily totals', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 16),
                      ],
                    )
                  : Column(
                      children: _loggedMeals.map((meal) => ListTile(
                        title: Text(meal['foodName'] ?? 'Meal', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${meal['mealType'].toUpperCase()} · ${meal['calories']} kcal'),
                        trailing: Text('${meal['protein']}g protein'),
                      )).toList(),
                    ),
            ),
            const SizedBox(height: 28),

            // --- Quick Add Templates Section ---
            const Text('Quick add', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Example nutrition estimates. Review serving sizes before tapping.', style: TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 16),

            _buildQuickAddCard('Oats with milk', 2705502, 150, 280, 12, 45, 6, 'Breakfast'),
            const SizedBox(height: 12),
            _buildQuickAddCard('Eggs and whole wheat toast', 2705503, 200, 320, 18, 25, 12, 'Breakfast'),
            const SizedBox(height: 12),
            _buildQuickAddCard('Rice, dal and vegetables', 2705504, 350, 450, 16, 75, 8, 'Lunch'),
            const SizedBox(height: 12),
            _buildQuickAddCard('Paneer with roti', 2705505, 250, 420, 24, 35, 20, 'Dinner'),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.grey.withValues(alpha: 0.08), blurRadius: 8, spreadRadius: 2)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildQuickAddCard(String name, int fdcId, double grams, double cals, double prot, double carbs, double fat, String mealType) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.grey.withValues(alpha: 0.08), blurRadius: 8, spreadRadius: 2)],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6)),
                      child: Text(mealType.toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.grey)),
                    )
                  ],
                ),
                const SizedBox(height: 4),
                Text('$cals kcal · ${prot}g protein', style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: _isLoading ? null : () => _loadMealTemplate(name, fdcId, grams, cals, prot, carbs, fat),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF3E8FF),
              foregroundColor: Colors.purple.shade800,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('+ Add to diary'),
          ),
        ],
      ),
    );
  }
}