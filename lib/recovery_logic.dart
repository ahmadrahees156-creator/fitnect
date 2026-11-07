import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class RecoveryLogic {
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  static Future fetchTodayRecovery(String token) async {
    final url = Uri.parse('$_baseUrl/api/recovery/today');
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
          return decoded['wellness'] ?? decoded['data'] ?? decoded;
        }
      }
    } catch (e) {
      debugPrint('Error fetching today recovery: $e');
    }
    return {};
  }

  static Future fetchRecoveryHistory(String token) async {
    final url = Uri.parse('$_baseUrl/api/recovery/history?limit=30');
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
          return decoded['history'] ?? decoded['data'] ?? [];
        } else if (decoded is List) {
          return decoded;
        }
      }
    } catch (e) {
      debugPrint('Error fetching recovery history: $e');
    }
    return [];
  }

  static Future<bool> saveRecoveryCheckIn(String token, Map body) async {
    final url = Uri.parse('$_baseUrl/api/recovery');
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
      debugPrint('Save recovery error: $e');
      return false;
    }
  }
}