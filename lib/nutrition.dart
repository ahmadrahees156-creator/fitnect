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

 
  final _foodNameController = TextEditingController();
  final _servingSizeController = TextEditingController();
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedMealType = 'breakfast';
  String _selectedServingUnit = 'serving';

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

  
  Future<void> _loadMealTemplate(String foodName, int fdcId, double defaultGrams, double cals, double prot, double carbs, double fat) async {
    setState(() => _isLoading = true);

    final url = Uri.parse('https://fitnect.onrender.com/api/nutrition-engine/meal-summary');

    final Map<String, dynamic> body = {
      "items": [
        {
          "fdc_id": fdcId,
          "grams": defaultGrams
        }
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
        setState(() {
          _foodNameController.text = foodName;
          _servingSizeController.text = defaultGrams.toString();
          _selectedServingUnit = 'grams';
          
          final totals = data['data']?['totals'] ?? {};
          _caloriesController.text = (totals['calories_kcal'] ?? cals).toString();
          _proteinController.text = (totals['protein_g'] ?? prot).toString();
          _carbsController.text = (totals['carbs_g'] ?? carbs).toString();
          _fatController.text = (totals['fat_g'] ?? fat).toString();
        });

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Loaded template: $foodName')),
        );
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
    } catch (e) {
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
      appBar: AppBar(
        title: const Text('Nutrition Tracker'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- Quick Add Templates Section ---
              const Text(
                'Simple meal ideas (Quick add)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Tap any template to load it into your log form.',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 12),
              
              // Template Card 1: Oats with milk
              Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: const Text('Oats with milk', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('280 kcal · 12g protein · BREAKFAST'),
                  trailing: ElevatedButton(
                    onPressed: _isLoading ? null : () => _loadMealTemplate('Oats with milk', 2705502, 150, 280, 12, 45, 6),
                    child: const Text('+ Load'),
                  ),
                ),
              ),

              // Template Card 2: Eggs and whole wheat toast
              Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 16),
                child: ListTile(
                  title: const Text('Eggs and whole wheat toast', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('320 kcal · 18g protein · BREAKFAST'),
                  trailing: ElevatedButton(
                    onPressed: _isLoading ? null : () => _loadMealTemplate('Eggs and whole wheat toast', 2705503, 200, 320, 18, 25, 12),
                    child: const Text('+ Load'),
                  ),
                ),
              ),

              const Divider(height: 32),

              // --- Manual Entry Form Section ---
              const Text(
                'Log Meal Form',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // Food Name
              TextFormField(
                controller: _foodNameController,
                decoration: const InputDecoration(
                  labelText: 'Food Name',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Please enter a food name' : null,
              ),
              const SizedBox(height: 12),

              // Meal Type Dropdown
              DropdownButtonFormField<String>(
                initialValue: _selectedMealType,
                decoration: const InputDecoration(
                  labelText: 'Meal Type',
                  border: OutlineInputBorder(),
                ),
                items: ['breakfast', 'lunch', 'dinner', 'snack']
                    .map((type) => DropdownMenuItem(
                          value: type,
                          child: Text(type[0].toUpperCase() + type.substring(1)),
                        ))
                    .toList(),
                onChanged: (val) => setState(() => _selectedMealType = val ?? 'breakfast'),
              ),
              const SizedBox(height: 12),

              // Serving Size & Unit Row
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _servingSizeController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Serving Size',
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || double.tryParse(val) == null ? 'Enter valid size' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: DropdownButtonFormField<String>(
                      initialValue: _selectedServingUnit,
                      decoration: const InputDecoration(
                        labelText: 'Unit',
                        border: OutlineInputBorder(),
                      ),
                      items: ['serving', 'grams', 'ml', 'cup']
                          .map((unit) => DropdownMenuItem(value: unit, child: Text(unit)))
                          .toList(),
                      onChanged: (val) => setState(() => _selectedServingUnit = val ?? 'serving'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Macros Grid Fields
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
                      decoration: const InputDecoration(labelText: 'Carbs (g)', border: OutlineInputBorder()),
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

              // Optional Notes
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes (Optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),

              // Save Meal Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitFoodItem,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
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
    );
  }
}