import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

class PhotoInjuryLogic {
  static const String _baseUrl = 'https://fitnect-api-1k4t.onrender.com';

  static Future analyzeInjuryPhoto(String token, XFile imageFile) async {
    final url = Uri.parse('$_baseUrl/api/image-analysis/predict');

    try {
      final bytes = await imageFile.readAsBytes();
      const int maxBytes = 8 * 1024 * 1024;
      if (bytes.length > maxBytes) {
        return {
          'success': false,
          'error': 'Image exceeds the 8 MB maximum file size limit.',
        };
      }

      final request = http.MultipartRequest('POST', url);
      request.headers['Authorization'] = 'Bearer $token';

      request.files.add(
        http.MultipartFile.fromBytes(
          'image',
          bytes,
          filename: imageFile.name.isNotEmpty ? imageFile.name : 'injury_photo.jpg',
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          return decoded;
        }
      } else if (response.statusCode == 400) {
        final decoded = _tryDecode(response.body);
        return {
          'success': false,
          'error': decoded['message'] ??
              decoded['error'] ??
              'Invalid image or unsupported body part. Please upload a clear JPG, JPEG, or PNG photo of a foot or lower limb.',
        };
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'error': 'Session expired or unauthorized. Please log in again.',
        };
      } else if (response.statusCode == 413) {
        return {
          'success': false,
          'error': 'File too large. Maximum allowed image size is 8 MB.',
        };
      } else if (response.statusCode == 503) {
        return {
          'success': false,
          'error': 'Image analysis service is temporarily unavailable. Please try again in a moment.',
        };
      } else {
        return {
          'success': false,
          'error': 'Analysis failed (Error ${response.statusCode}). Please try again.',
        };
      }
    } catch (e) {
      debugPrint('Photo injury analysis error: $e');
      return {
        'success': false,
        'error': 'Network error while uploading image. Please check your connection.',
      };
    }

    return {
      'success': false,
      'error': 'Unexpected response from server.',
    };
  }

  static Map _tryDecode(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map) return decoded;
    } catch (_) {}
    return {};
  }
}