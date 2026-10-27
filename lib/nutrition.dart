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
  final _servingSizeController = TextEditingController(text: '100');
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _notesController = TextEditingController();

  
  String _selectedMealType = 'breakfast';
  String _selectedServingUnit = 'g';

  bool _isLoading = false;

  
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
      "servingSize": double.tryParse(_servingSizeController.text) ?? 100.0,
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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Food item logged successfully! (201 Created)')),
          );
          Navigator.pop(context); 
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to log food: Status ${response.statusCode}')),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F6FC),
      appBar: AppBar(
        title: const Text('Record Food Item'),
        backgroundColor: const Color(0xFF8E24AA),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              
              const Text('Meal Type', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _selectedMealType,
                decoration: _inputDecoration(),
                items: _mealTypes.map((m) => DropdownMenuItem(value: m['value'], child: Text(m['label']!))).toList(),
                onChanged: (val) => setState(() => _selectedMealType = val!),
              ),
              const SizedBox(height: 12),

              
              _buildTextField('Food Name', _foodNameController, isNumber: false),

              
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: _buildTextField('Serving Size', _servingSizeController, isNumber: true),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Unit', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedServingUnit,
                          decoration: _inputDecoration(),
                          items: _servingUnits.map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(),
                          onChanged: (val) => setState(() => _selectedServingUnit = val!),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              
              _buildTextField('Calories (kcal)', _caloriesController),
              _buildTextField('Protein (g)', _proteinController),
              _buildTextField('Carbohydrates (g)', _carbsController),
              _buildTextField('Fat (g)', _fatController),
              _buildTextField('Notes (Optional)', _notesController, isNumber: false, isRequired: false),

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitFoodItem,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8E24AA),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save Food Entry', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool isNumber = true, bool isRequired = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
            decoration: _inputDecoration(),
            validator: (value) {
              if (!isRequired) return null;
              if (value == null || value.isEmpty) return 'This field is required';
              if (isNumber && double.tryParse(value) == null) return 'Enter a valid number';
              return null;
            },
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    );
  }
}