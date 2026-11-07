import 'package:flutter/material.dart';
import 'nutrition_logic.dart';

class NutritionScreen extends StatefulWidget {
  final String token;
  const NutritionScreen({super.key, required this.token});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  bool _isLoading = false;
  List<dynamic> _searchResults = [];

  final _foodNameController = TextEditingController();
  final _foodSearchController = TextEditingController();
  final _servingSizeController = TextEditingController(text: '1');
  final _caloriesController = TextEditingController(text: '0');
  final _proteinController = TextEditingController(text: '0');
  final _fatController = TextEditingController(text: '0');
  final _carbsController = TextEditingController(text: '0');
  final _notesController = TextEditingController();

  final _selectedMealType = 'breakfast';
  final _selectedServingUnit = 'serving';

  String _selectedDrinkType = 'Water';
  final _hydrationController = TextEditingController(text: '250');
  double _totalFluidLiters = 0.0;

  double _consumedCalories = 0.0;
  double _consumedProtein = 0.0;
  double _consumedCarbs = 0.0;
  double _consumedFat = 0.0;
  List<dynamic> _mealEntries = [];

  Map<String, dynamic> _targets = {
    "calories_kcal": 2000,
    "protein_g": 100,
    "carbs_g": 250,
    "fat_g": 70
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final todayData = await NutritionLogic.fetchTodayNutrition(widget.token);
    final targetData = await NutritionLogic.fetchTargets(widget.token);

    if (!mounted) return;

    List entries = [];
    if (todayData['entries'] != null) {
      entries = todayData['entries'];
    } else if (todayData['data'] != null) {
      entries = todayData['data'];
    } else if (todayData is List) {
      entries = todayData;
    }

    double calcCalories = 0.0;
    double calcProtein = 0.0;
    double calcCarbs = 0.0;
    double calcFat = 0.0;

    for (var entry in entries) {
      calcCalories += (entry['calories'] ?? entry['calories_kcal'] ?? 0).toDouble();
      calcProtein += (entry['protein'] ?? entry['protein_g'] ?? 0).toDouble();
      calcCarbs += (entry['carbohydrates'] ?? entry['carbs'] ?? entry['carbs_g'] ?? 0).toDouble();
      calcFat += (entry['fat'] ?? entry['fat_g'] ?? 0).toDouble();
    }

    setState(() {
      _consumedCalories = calcCalories > 0 ? calcCalories : (todayData['total_calories'] ?? todayData['calories'] ?? 0.0).toDouble();
      _consumedProtein = calcProtein > 0 ? calcProtein : (todayData['total_protein'] ?? todayData['protein'] ?? 0.0).toDouble();
      _consumedCarbs = calcCarbs > 0 ? calcCarbs : (todayData['total_carbs'] ?? todayData['carbs'] ?? 0.0).toDouble();
      _consumedFat = calcFat > 0 ? calcFat : (todayData['total_fat'] ?? todayData['fat'] ?? 0.0).toDouble();
      _mealEntries = entries;

      if (targetData.isNotEmpty) {
        _targets = targetData;
      }
    });
  }

  Future<void> _handleSearch(String query) async {
    final results = await NutritionLogic.searchFoods(widget.token, query);
    if (!mounted) return;
    setState(() => _searchResults = results);
  }

  Future<void> _handleSaveMeal() async {
    setState(() => _isLoading = true);
    final body = {
      "date": DateTime.now().toIso8601String().split('T')[0],
      "foodName": _foodNameController.text.trim().isNotEmpty ? _foodNameController.text.trim() : 'Custom Meal',
      "mealType": _selectedMealType,
      "servingSize": double.tryParse(_servingSizeController.text) ?? 1.0,
      "servingUnit": _selectedServingUnit,
      "calories": double.tryParse(_caloriesController.text) ?? 0.0,
      "protein": double.tryParse(_proteinController.text) ?? 0.0,
      "carbohydrates": double.tryParse(_carbsController.text) ?? 0.0,
      "fat": double.tryParse(_fatController.text) ?? 0.0,
      "notes": _notesController.text.trim(),
    };

    bool success = await NutritionLogic.saveMeal(widget.token, body);
    if (!mounted) return;

    setState(() => _isLoading = false);
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Meal logged successfully!')));
      _foodNameController.clear();
      _notesController.clear();
      _loadData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to log meal')));
    }
  }

  void _addDrink() {
    final amountMl = double.tryParse(_hydrationController.text) ?? 0;
    if (amountMl > 0) {
      setState(() {
        _totalFluidLiters += (amountMl / 1000.0);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added ${amountMl.toStringAsFixed(0)} ml of $_selectedDrinkType!')),
      );
    }
  }

  List _getPast7Days() {
    List days = [];
    final now = DateTime.now();
    for (int i = 6; i >= 0; i--) {
      final d = now.subtract(Duration(days: i));
      String formattedDate = "${_getDayName(d.weekday)}, ${d.day} ${_getMonthName(d.month)}";
      double cals = (i == 0) ? _consumedCalories : 0.0;
      days.add({"day": formattedDate, "kcal": cals});
    }
    return days;
  }

  String _getDayName(int weekday) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday - 1];
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    final targetCalories = (_targets['calories_kcal'] ?? 2000).toDouble();
    final targetProtein = (_targets['protein_g'] ?? 100).toDouble();
    final targetCarbs = (_targets['carbs_g'] ?? 250).toDouble();
    final targetFat = (_targets['fat_g'] ?? 70).toDouble();
    final pastDays = _getPast7Days();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5FC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('FitNect\nNutrition', style: TextStyle(color: Colors.black54, fontSize: 12, height: 1.2)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              backgroundColor: const Color(0xFF10B981),
              radius: 14,
              child: const Text('A', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFEDE9FE), Color(0xFFFCE7F3)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('YOUR DAILY NOURISHMENT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 6),
                        const Text('Fuel your body.\nFeel your best.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.2)),
                        const SizedBox(height: 6),
                        const Text('Track your food, record your drinks and understand your daily intake.', style: TextStyle(fontSize: 10, color: Colors.black54)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Today's nutrition", style: TextStyle(fontSize: 10, color: Colors.grey)),
                        const SizedBox(height: 4),
                        Text('${_consumedCalories.toStringAsFixed(0)} kcal', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('Protein: ${_consumedProtein.toStringAsFixed(1)} g', style: const TextStyle(fontSize: 9, color: Colors.black54)),
                        Text('Fluid: ${_totalFluidLiters.toStringAsFixed(2)} L', style: const TextStyle(fontSize: 9, color: Colors.black54)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.8,
              children: [
                _buildMetricCard('Calories consumed', '${_consumedCalories.toStringAsFixed(0)} kcal', '${targetCalories > _consumedCalories ? (targetCalories - _consumedCalories).toStringAsFixed(0) : 0} kcal remaining', Icons.local_fire_department, Colors.orange),
                _buildMetricCard('Protein intake', '${_consumedProtein.toStringAsFixed(1)} g', '${targetProtein > _consumedProtein ? (targetProtein - _consumedProtein).toStringAsFixed(1) : 0}g remaining', Icons.egg, Colors.amber),
                _buildMetricCard('Fluid intake', '${_totalFluidLiters.toStringAsFixed(2)} L', '2,500 ml target', Icons.water_drop, Colors.blue),
                _buildMetricCard('Meals logged', '${_mealEntries.length} meals', '${_mealEntries.length} entries today', Icons.restaurant_menu, Colors.pink),
              ],
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DAILY WELLNESS\nHydration tracker(ml)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(
                    children: ['Water', 'Electrolyte', 'Milk', 'Juice', 'Other'].map((drink) {
                      final isSelected = _selectedDrinkType == drink;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedDrinkType = drink),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFEDE9FE) : Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(child: Text(drink, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF6B4FA0) : Colors.black87))),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _hydrationController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.grey.shade50,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.black, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)),
                        onPressed: _addDrink,
                        child: const Text('Add drink', style: TextStyle(color: Colors.white, fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DAILY TARGETS\nNutrition overview', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildTargetBar('Calories', _consumedCalories, targetCalories, 'kcal', Colors.orange),
                  const SizedBox(height: 12),
                  _buildTargetBar('Protein', _consumedProtein, targetProtein, 'g', Colors.amber),
                  const SizedBox(height: 12),
                  _buildTargetBar('Carbohydrates', _consumedCarbs, targetCarbs, 'g', Colors.green),
                  const SizedBox(height: 12),
                  _buildTargetBar('Fat', _consumedFat, targetFat, 'g', Colors.pink),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('KEEP & RECORD\nLog your meal', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _foodNameController,
                    decoration: InputDecoration(
                      hintText: 'Food name (e.g. Roti)',
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _foodSearchController,
                    onChanged: _handleSearch,
                    decoration: InputDecoration(
                      hintText: 'Search foods (e.g. banana)',
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    ),
                  ),
                  if (_searchResults.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      height: 100,
                      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade200)),
                      child: ListView.builder(
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) {
                          final item = _searchResults[index];
                          return ListTile(
                            dense: true,
                            title: Text(item['name'] ?? item['description'] ?? '', style: const TextStyle(fontSize: 11)),
                            onTap: () {
                              setState(() {
                                _foodNameController.text = item['name'] ?? item['description'] ?? '';
                                final np = item['nutritionPer100g'] ?? {};
                                _caloriesController.text = (np['caloriesKcal'] ?? 0).toString();
                                _proteinController.text = (np['proteinG'] ?? 0).toString();
                                _searchResults = [];
                              });
                            },
                          );
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildTextField('Calories', _caloriesController)),
                      const SizedBox(width: 10),
                      Expanded(child: _buildTextField('Protein', _proteinController)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 12)),
                      onPressed: _isLoading ? null : _handleSaveMeal,
                      child: const Text('Save meal', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("TODAY'S FOOD\nMeal diary", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _mealEntries.isEmpty
                      ? const Text('Your meal diary is empty', style: TextStyle(color: Colors.grey, fontSize: 11))
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _mealEntries.length,
                          itemBuilder: (context, index) {
                            final entry = _mealEntries[index];
                            return ListTile(
                              title: Text(entry['foodName'] ?? 'Meal', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              subtitle: Text('${entry['calories']} kcal', style: const TextStyle(fontSize: 10)),
                              trailing: Text('${entry['protein']}g protein', style: const TextStyle(fontSize: 10)),
                            );
                          },
                        ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('YOUR NUTRITION JOURNEY\nNutrition history', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ...pastDays.map((d) => _buildHistoryRow(d['day'] as String, d['kcal'] as double)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, String subtitle, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          Text(subtitle, style: const TextStyle(fontSize: 8, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildTargetBar(String label, double current, double target, String unit, Color color) {
    final progress = target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            Text('${current.toStringAsFixed(0)} / ${target.toStringAsFixed(0)} $unit', style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(value: progress, backgroundColor: Colors.grey.shade100, color: color, minHeight: 6),
      ],
    );
  }

  Widget _buildHistoryRow(String day, double kcal) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          SizedBox(width: 85, child: Text(day, style: const TextStyle(fontSize: 10, color: Colors.grey))),
          Expanded(
            child: Container(
              height: 8,
              decoration: BoxDecoration(color: const Color(0xFFEDE9FE), borderRadius: BorderRadius.circular(4)),
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: (kcal / 3000).clamp(0.0, 1.0),
                child: Container(decoration: BoxDecoration(color: const Color(0xFF6B4FA0), borderRadius: BorderRadius.circular(4))),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text('${kcal.toStringAsFixed(0)} kcal', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}