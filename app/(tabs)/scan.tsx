import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CalorieResult {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface MealEntry {
  id: string;
  food: string;
  calories: number;
  imageUri: string | null;
  timestamp: string;
}

// ─── AI Calorie Analyzer ─────────────────────────────────────────────────────
// Uses GPT-4o vision to analyze food images
// Get your API key from: https://platform.openai.com/api-keys
// The API key should be stored securely — for production, use a backend service
const OPENAI_API_KEY = ''; // ← Add your key here: 'sk-...'

async function analyzeFoodWithAI(imageUri: string): Promise<CalorieResult[]> {
  if (!OPENAI_API_KEY) {
    // Demo mode: return mock data if no API key is set
    console.log('[CalorieScan] No API key — returning demo results');
    await new Promise(r => setTimeout(r, 2000));
    return [
      { food: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 4, confidence: 0.92 },
      { food: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 2, confidence: 0.88 },
      { food: 'Steamed Broccoli', calories: 55, protein: 4, carbs: 11, fat: 0, confidence: 0.95 },
    ];
  }

  const formData = new FormData();
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  formData.append('image', {
    uri: imageUri,
    name: `food.${fileType}`,
    type: `image/${fileType}`,
  } as any);

  formData.append('model', 'gpt-4o');
  formData.append('messages', JSON.stringify([
    {
      role: 'user',
      content: `Analyze this food image and estimate the calories and macros for each food item present.
Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{"items": [{"food": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": 0.0-1.0}]}
Include only foods you can clearly identify. Total calories should be realistic for the portion size shown.`,
    }
  ]));
  formData.append('max_tokens', '500');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this food image and estimate calories and macros for each item.
Respond ONLY with valid JSON like this:
{"items": [{"food": "name", "calories": 100, "protein": 10, "carbs": 20, "fat": 5, "confidence": 0.9}]}
Only include clearly identifiable foods. Be realistic about portion sizes.`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUri },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.items.map((item: any) => ({
        food: item.food,
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        confidence: Number(item.confidence) || 0.8,
      }));
    }
    throw new Error('Could not parse AI response');
  } catch (err) {
    console.error('[CalorieScan] AI analysis failed:', err);
    throw err;
  }
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [results, setResults] = useState<CalorieResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [manualFood, setManualFood] = useState<string>('');
  const [manualCalories, setManualCalories] = useState<string>('');

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    console.log('[CalorieScan] Requesting camera permission');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[CalorieScan] Camera permission:', status);
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  // Take photo
  const takePhoto = useCallback(async () => {
    console.log('[CalorieScan] takePhoto called');
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Camera Permission', 'Camera access is needed to scan food. Please enable it in Settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() },
        ]);
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      console.log('[CalorieScan] Camera result:', result.canceled ? 'canceled' : 'success');
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setResults(null);
        setError(null);
        analyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[CalorieScan] Camera error:', err);
      setError('Failed to open camera. Please try again.');
    }
  }, [hasPermission, requestCameraPermission]);

  // Pick from gallery
  const pickImage = useCallback(async () => {
    console.log('[CalorieScan] pickImage called');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant photo library access to select food images.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[CalorieScan] Image picked:', result.assets[0].uri);
        setImageUri(result.assets[0].uri);
        setResults(null);
        setError(null);
        analyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[CalorieScan] Gallery error:', err);
      setError('Failed to pick image. Please try again.');
    }
  }, []);

  // Analyze image with AI
  const analyzeImage = useCallback(async (uri: string) => {
    console.log('[CalorieScan] Analyzing image:', uri);
    setAnalyzing(true);
    setError(null);

    try {
      const analysisResults = await analyzeFoodWithAI(uri);
      console.log('[CalorieScan] Analysis complete:', analysisResults.length, 'items found');
      setResults(analysisResults);
    } catch (err) {
      console.error('[CalorieScan] Analysis error:', err);
      setError('AI analysis failed. Try again or use manual entry.');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Reset to fresh state
  const resetScan = useCallback(() => {
    console.log('[CalorieScan] Reset');
    setImageUri(null);
    setResults(null);
    setError(null);
    setManualMode(false);
    setManualFood('');
    setManualCalories('');
  }, []);

  // Manual entry
  const submitManual = useCallback(() => {
    if (!manualFood.trim() || !manualCalories.trim()) {
      Alert.alert('Missing Info', 'Please enter food name and calories.');
      return;
    }
    const cal = parseInt(manualCalories, 10);
    if (isNaN(cal) || cal <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
    }
    setResults([{ food: manualFood.trim(), calories: cal, protein: 0, carbs: 0, fat: 0, confidence: 1 }]);
    setManualMode(false);
  }, [manualFood, manualCalories]);

  const totalCalories = results ? results.reduce((sum, r) => sum + r.calories, 0) : 0;

  // ─── Render: Camera/Upload Screen ──────────────────────────────────────────
  if (!imageUri) {
    return (
      <View style={styles.container} testID="scan-screen">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calorie Scan</Text>
          <Text style={styles.headerSubtitle}>AI-powered food analysis</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Snap your meal</Text>
          <Text style={styles.emptySubtitle}>
            Take a photo of your food and our AI will estimate calories and macros instantly
          </Text>
        </View>

        {/* Feature pills */}
        <View style={styles.featurePills}>
          <View style={styles.pill}><Text style={styles.pillText}>🥗 Nutrition</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>🔥 Calories</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>📊 Macros</Text></View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={takePhoto}
            activeOpacity={0.8}
            testID="take-photo-button"
          >
            <Text style={styles.cameraButtonIcon}>📷</Text>
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImage}
            activeOpacity={0.8}
            testID="gallery-button"
          >
            <Text style={styles.galleryButtonIcon}>🖼</Text>
            <Text style={styles.galleryButtonText}>From Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setManualMode(true)}
            activeOpacity={0.7}
            testID="manual-entry-button"
          >
            <Text style={styles.manualButtonText}>✏️ Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Setup notice */}
        <View style={styles.setupNotice}>
          <Text style={styles.setupNoticeText}>
            💡 To enable AI analysis, add your OpenAI API key in the source code (scan.tsx)
          </Text>
        </View>
      </View>
    );
  }

  // ─── Render: Manual Entry ─────────────────────────────────────────────────
  if (manualMode) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetScan}>
            <Text style={styles.backBtn}>← Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.manualEntryContainer}>
          <Text style={styles.manualEntryTitle}>✏️ Manual Entry</Text>
          <Text style={styles.manualEntrySubtitle}>Enter food details manually</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Food Name</Text>
            <TextInput
              style={styles.textInput}
              value={manualFood}
              onChangeText={setManualFood}
              placeholder="e.g. Grilled Chicken Salad"
              placeholderTextColor="#3A3A4E"
              testID="manual-food-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Calories</Text>
            <TextInput
              style={styles.textInput}
              value={manualCalories}
              onChangeText={setManualCalories}
              placeholder="e.g. 350"
              placeholderTextColor="#3A3A4E"
              keyboardType="number-pad"
              testID="manual-calories-input"
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitManual}
            testID="submit-manual-button"
          >
            <Text style={styles.submitButtonText}>Add to Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Render: Results Screen ───────────────────────────────────────────────
  return (
    <View style={styles.container} testID="scan-results-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={resetScan}>
          <Text style={styles.backBtn}>← Scan Again</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo preview */}
        <View style={styles.photoPreview}>
          <Image source={{ uri: imageUri }} style={styles.photoImage} />
          {analyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#00D4AA" />
              <Text style={styles.analyzingText}>AI analyzing...</Text>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results && (
          <>
            {/* Total calories */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Estimated</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>{totalCalories}</Text>
                <Text style={styles.totalUnit}>kcal</Text>
              </View>
            </View>

            {/* Per-item breakdown */}
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            {results.map((item, i) => (
              <View key={i} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultFood}>{item.food}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round(item.confidence * 100)}% confident
                    </Text>
                  </View>
                </View>
                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.calories}</Text>
                    <Text style={styles.macroLabel}>cal</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.protein}g</Text>
                    <Text style={styles.macroLabel}>protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.carbs}g</Text>
                    <Text style={styles.macroLabel}>carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.fat}g</Text>
                    <Text style={styles.macroLabel}>fat</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Add to daily log */}
            <TouchableOpacity style={styles.logButton} testID="add-to-log-button">
              <Text style={styles.logButtonText}>+ Add to Today's Log</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090910',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  backBtn: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#5A5A6E',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5A5A6E',
    textAlign: 'center',
    lineHeight: 20,
  },
  featurePills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  pill: {
    backgroundColor: '#14141C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A5A6E',
  },
  buttonGroup: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 30,
  },
  cameraButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cameraButtonIcon: {
    fontSize: 20,
  },
  cameraButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#090910',
  },
  galleryButton: {
    backgroundColor: '#14141C',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  galleryButtonIcon: {
    fontSize: 18,
  },
  galleryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A5A6E',
  },
  setupNotice: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 159, 67, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.2)',
  },
  setupNoticeText: {
    fontSize: 12,
    color: '#FF9F43',
    lineHeight: 18,
    textAlign: 'center',
  },
  // Results
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#14141C',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 16, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzingText: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 14,
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: '#14141C',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  totalLabel: {
    fontSize: 13,
    color: '#5A5A6E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#00D4AA',
    letterSpacing: -3,
  },
  totalUnit: {
    fontSize: 20,
    color: '#5A5A6E',
    fontWeight: '600',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#14141C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultFood: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 10,
    color: '#00D4AA',
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroLabel: {
    fontSize: 10,
    color: '#5A5A6E',
    marginTop: 2,
  },
  logButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#090910',
  },
  // Manual entry
  manualEntryContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  manualEntryTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  manualEntrySubtitle: {
    fontSize: 14,
    color: '#5A5A6E',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A5A6E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  submitButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#090910',
  },
});
