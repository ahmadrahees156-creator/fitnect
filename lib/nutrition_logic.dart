import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class NutritionLogic {
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  static Future fetchTodayNutrition(String token) async {
    final url = Uri.parse('$_baseUrl/api/nutrition/today');
    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          return decoded;
        }
      }
    } catch (e) {
      debugPrint('Error fetching nutrition: $e');
    }
    return {};
  }

  static Future fetchTargets(String token) async {
    final url = Uri.parse('$_baseUrl/api/nutrition-engine/nutrition-targets');
    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['data'] != null) {
          return data['data']['estimated_daily_targets'] ?? {};
        }
      }
    } catch (e) {
      debugPrint('Error fetching targets: $e');
    }
    return {};
  }

  static Future searchFoods(String token, String query) async {
    if (query.length < 2) return [];
    final url = Uri.parse('$_baseUrl/api/foods?search=$query');
    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map) {
          return data['data'] ?? [];
        }
      }
    } catch (e) {
      debugPrint('Search error: $e');
    }
    return [];
  }

  static Future<bool> saveMeal(String token, Map body) async {
    final url = Uri.parse('$_baseUrl/api/nutrition');
    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Save meal error: $e');
      return false;
    }
  }
}