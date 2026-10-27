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

  
  final _foodNameController = TextEditingController();
  final _servingSizeController = TextEditingController(text: '1');
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedMealType = 'breakfast';
  String _selectedServingUnit = 'serving';
  bool _isLoading = false;

  
  double _totalCalories = 0.0;
  double _totalProtein = 0.0;
  double _totalCarbs = 0.0;
  double _totalFat = 0.0;
  int _mealCount = 0;

  final List<Map<String, String>> _mealTypes = [
    {'label': 'Breakfast', 'value': 'breakfast'},
    {'label': 'Lunch', 'value': 'lunch'},
    {'label': 'Dinner', 'value': 'dinner'},
    {'label': 'Snack', 'value': 'snack'},
  ];

  final List<String> _servingUnits = ['g', 'ml', 'piece', 'cup', 'serving'];

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

  Future<void> _submitFoodItem() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final url = Uri.parse('https://fitnect.onrender.com/api/nutrition');

    final Map<String, dynamic> body = {
      "foodName": _foodNameController.text.trim(),
      "mealType": _selectedMealType,
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

      if (response.statusCode == 201 || response.statusCode == 200) {
        setState(() {
          _totalCalories += double.tryParse(_caloriesController.text) ?? 0.0;
          _totalProtein += double.tryParse(_proteinController.text) ?? 0.0;
          _totalCarbs += double.tryParse(_carbsController.text) ?? 0.0;
          _totalFat += double.tryParse(_fatController.text) ?? 0.0;
          _mealCount += 1;
        });

        _foodNameController.clear();
        _caloriesController.clear();
        _proteinController.clear();
        _carbsController.clear();
        _fatController.clear();
        _notesController.clear();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Meal logged successfully!')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to log meal: Status ${response.statusCode}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Connection error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  
  void _quickAddMeal(String name, String mealType, double cal, double prot, double carb, double fat) {
    setState(() {
      _foodNameController.text = name;
      _selectedMealType = mealType;
      _caloriesController.text = cal.toString();
      _proteinController.text = prot.toString();
      _carbsController.text = carb.toString();
      _fatController.text = fat.toString();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Loaded "$name" into form. Review and tap Save meal!'), duration: const Duration(seconds: 1)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F6FC),
      appBar: AppBar(
        title: const Text('Nutrition & Diet'),
        backgroundColor: const Color(0xFF8E24AA),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEEDCF8), Color(0xFFFCE4EC)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Fuel your body.\nFeel your best.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87 )),
                        SizedBox(height: 6),
                        Text('Track your food, record meals and understand your daily intake.', style: TextStyle(fontSize: 12, color: Colors.black54)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        const Text("Today's nutrition", style: TextStyle(fontSize: 10, color: Colors.grey)),
                        Text('${_totalCalories.toStringAsFixed(0)} kcal', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF8E24AA))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            
            Row(
              children: [
                Expanded(child: _buildMetricCard('Calories consumed', '${_totalCalories.toStringAsFixed(0)} kcal', Icons.local_fire_department, Colors.orange)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Protein intake', '${_totalProtein.toStringAsFixed(1)} g', Icons.egg, Colors.amber)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildMetricCard('Fluid intake', '0.15 L', Icons.water_drop, Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Meals logged', '$_mealCount meals', Icons.restaurant, Colors.purple)),
              ],
            ),
            const SizedBox(height: 24),

            
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Nutrition overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  const Text('Compare intake with your saved goals.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 14),
                  _buildProgressIndicator('Calories', _totalCalories, 2000, 'kcal'),
                  _buildProgressIndicator('Protein', _totalProtein, 100, 'g'),
                  _buildProgressIndicator('Carbohydrates', _totalCarbs, 250, 'g'),
                  _buildProgressIndicator('Fat', _totalFat, 70, 'g'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Log your meal', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Text('Save meal details to your FitNect account.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 16),

                    const Text('Food name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _foodNameController,
                      decoration: _inputDecoration('e.g. Paneer and roti'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),

                    const Text('Meal type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedMealType,
                      decoration: _inputDecoration(''),
                      items: _mealTypes.map((m) => DropdownMenuItem(value: m['value'], child: Text(m['label']!))).toList(),
                      onChanged: (val) => setState(() => _selectedMealType = val!),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Serving size', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              TextFormField(
                                controller: _servingSizeController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: _inputDecoration('1'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Serving unit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<String>(
                                initialValue: _selectedServingUnit,
                                decoration: _inputDecoration(''),
                                items: _servingUnits.map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(),
                                onChanged: (val) => setState(() => _selectedServingUnit = val!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(child: _buildNumberField('Calories (kcal)', _caloriesController)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildNumberField('Protein (g)', _proteinController)),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(child: _buildNumberField('Carbohydrates (g)', _carbsController)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildNumberField('Fat (g)', _fatController)),
                      ],
                    ),
                    const SizedBox(height: 12),

                    const Text('Notes (optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _notesController,
                      decoration: _inputDecoration('Anything you want to remember...'),
                    ),
                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _submitFoodItem,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black87,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _isLoading
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Save meal', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            
            const Text('Simple meal ideas (Quick add)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Tap any template to load it into your log form.', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 12),

            _buildQuickAddCard('Oats with milk', 'breakfast', 280, 12, 45, 6),
            _buildQuickAddCard('Eggs and whole wheat toast', 'breakfast', 320, 18, 25, 12),
            _buildQuickAddCard('Rice, dal and vegetables', 'lunch', 450, 16, 75, 10),
            _buildQuickAddCard('Paneer with roti', 'dinner', 420, 24, 35, 20),
            _buildQuickAddCard('Banana and almonds', 'snack', 190, 5, 28, 7),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator(String label, double current, double target, String unit) {
    double progress = (current / target).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              Text('${current.toStringAsFixed(0)} / $target $unit', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey.shade100,
            color: const Color(0xFF8E24AA),
            minHeight: 6,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }

  Widget _buildNumberField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: _inputDecoration('0'),
          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
        ),
      ],
    );
  }

  Widget _buildQuickAddCard(String name, String mealType, double cal, double prot, double carb, double fat) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
      child: ListTile(
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text('$cal kcal · $prot g protein · ${mealType.toUpperCase()}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
        trailing: OutlinedButton(
          onPressed: () => _quickAddMeal(name, mealType, cal, prot, carb, fat),
          child: const Text('+ Load', style: TextStyle(fontSize: 12)),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFFFAFAFA),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
    );
  }
}