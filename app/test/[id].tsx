
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { commonStyles, colors } from '../../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

const { width, height } = Dimensions.get('window');

interface TestResult {
  id: string;
  testId: string;
  timestamp: number;
  videoUri?: string;
  measurements: any;
  score: number;
  analysis: string;
}

const testInstructions = {
  'vertical-jump': {
    title: 'Vertical Jump Test',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Place your hands on your hips',
      'Jump as high as possible',
      'Land softly on both feet',
      'Perform 3 attempts'
    ],
    duration: 120,
    tips: 'Use your arms for momentum and bend your knees before jumping'
  },
  'shuttle-run': {
    title: 'Shuttle Run Test',
    instructions: [
      'Set up two markers 10 meters apart',
      'Start at one marker',
      'Run to the other marker and back',
      'Touch each marker with your hand',
      'Complete 5 round trips'
    ],
    duration: 180,
    tips: 'Focus on quick direction changes and maintain speed'
  },
  'sit-ups': {
    title: 'Sit-ups Test',
    instructions: [
      'Lie on your back with knees bent',
      'Place hands behind your head',
      'Lift your torso to touch your knees',
      'Lower back down with control',
      'Perform for 60 seconds'
    ],
    duration: 60,
    tips: 'Keep your core engaged and avoid pulling on your neck'
  },
  'endurance-run': {
    title: 'Endurance Run Test',
    instructions: [
      'Find a safe running area or track',
      'Run at a steady pace for 12 minutes',
      'Try to cover maximum distance',
      'Maintain consistent breathing',
      'Record total distance covered'
    ],
    duration: 720,
    tips: 'Start at a comfortable pace and maintain it throughout'
  },
  'height-weight': {
    title: 'Height & Weight Measurement',
    instructions: [
      'Stand straight against a wall',
      'Remove shoes for height measurement',
      'Look straight ahead',
      'Record measurements accurately',
      'Take multiple readings for accuracy'
    ],
    duration: 60,
    tips: 'Ensure accurate measurements for proper assessment'
  }
};

export default function TestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'instructions' | 'recording' | 'review'>('instructions');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const testConfig = testInstructions[id as keyof typeof testInstructions];

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (timer >= testConfig?.duration && isRecording) {
      stopRecording();
    }
  }, [timer, testConfig?.duration, isRecording]);

  const startRecording = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to record videos');
        return;
      }
    }

    if (!mediaPermission?.granted) {
      const result = await requestMediaPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Media library permission is required to save videos');
        return;
      }
    }

    try {
      setIsRecording(true);
      setIsActive(true);
      setTimer(0);
      setCurrentStep('recording');

      const video = await cameraRef.current?.recordAsync({
        maxDuration: testConfig.duration,
        quality: '720p',
      });

      if (video) {
        setRecordedVideo(video.uri);
        setCurrentStep('review');
      }
    } catch (error) {
      console.log('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsActive(false);
      await cameraRef.current?.stopRecording();
    } catch (error) {
      console.log('Error stopping recording:', error);
    }
  };

  const saveResult = async () => {
    try {
      // Simulate AI analysis
      const mockAnalysis = generateMockAnalysis(id as string, timer);
      
      const result: TestResult = {
        id: Date.now().toString(),
        testId: id as string,
        timestamp: Date.now(),
        videoUri: recordedVideo || undefined,
        measurements: mockAnalysis.measurements,
        score: mockAnalysis.score,
        analysis: mockAnalysis.analysis,
      };

      // Save to AsyncStorage
      const existingResults = await AsyncStorage.getItem('testResults');
      const results = existingResults ? JSON.parse(existingResults) : [];
      results.push(result);
      await AsyncStorage.setItem('testResults', JSON.stringify(results));

      // Update completed tests
      const completedTests = await AsyncStorage.getItem('completedTests');
      const completed = completedTests ? JSON.parse(completedTests) : [];
      if (!completed.includes(id)) {
        completed.push(id);
        await AsyncStorage.setItem('completedTests', JSON.stringify(completed));
      }

      Alert.alert(
        'Test Completed!',
        `Your ${testConfig.title} has been analyzed and saved.`,
        [
          { text: 'View Results', onPress: () => router.push('/results') },
          { text: 'Back to Home', onPress: () => router.push('/') },
        ]
      );
    } catch (error) {
      console.log('Error saving result:', error);
      Alert.alert('Error', 'Failed to save test result');
    }
  };

  const generateMockAnalysis = (testId: string, duration: number) => {
    // This would be replaced with actual AI analysis
    switch (testId) {
      case 'vertical-jump':
        return {
          measurements: { height: Math.floor(Math.random() * 30) + 40 },
          score: Math.floor(Math.random() * 40) + 60,
          analysis: 'Good explosive power. Focus on landing technique for improvement.'
        };
      case 'shuttle-run':
        return {
          measurements: { time: (Math.random() * 5 + 15).toFixed(2) },
          score: Math.floor(Math.random() * 30) + 70,
          analysis: 'Excellent agility. Work on acceleration from stationary position.'
        };
      case 'sit-ups':
        return {
          measurements: { reps: Math.floor(Math.random() * 20) + 30 },
          score: Math.floor(Math.random() * 35) + 65,
          analysis: 'Strong core endurance. Maintain proper form throughout.'
        };
      case 'endurance-run':
        return {
          measurements: { distance: (Math.random() * 1000 + 2000).toFixed(0) },
          score: Math.floor(Math.random() * 25) + 75,
          analysis: 'Good cardiovascular fitness. Consider interval training.'
        };
      default:
        return {
          measurements: {},
          score: Math.floor(Math.random() * 50) + 50,
          analysis: 'Test completed successfully.'
        };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testConfig) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={commonStyles.title}>Test Not Found</Text>
        <Button text="Go Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>{testConfig.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {currentStep === 'instructions' && (
        <View style={commonStyles.content}>
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Instructions</Text>
            {testConfig.instructions.map((instruction, index) => (
              <View key={index} style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
                <Text style={[commonStyles.text, { marginRight: 8 }]}>{index + 1}.</Text>
                <Text style={[commonStyles.text, { flex: 1 }]}>{instruction}</Text>
              </View>
            ))}
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Tips</Text>
            <Text style={commonStyles.text}>{testConfig.tips}</Text>
          </View>

          <View style={commonStyles.card}>
            <View style={commonStyles.row}>
              <View style={commonStyles.center}>
                <Icon name="time-outline" size={24} color={colors.primary} />
                <Text style={commonStyles.textSecondary}>Duration</Text>
                <Text style={commonStyles.text}>{formatTime(testConfig.duration)}</Text>
              </View>
              <View style={commonStyles.center}>
                <Icon name="videocam-outline" size={24} color={colors.primary} />
                <Text style={commonStyles.textSecondary}>Recording</Text>
                <Text style={commonStyles.text}>Required</Text>
              </View>
              <View style={commonStyles.center}>
                <Icon name="analytics-outline" size={24} color={colors.primary} />
                <Text style={commonStyles.textSecondary}>Analysis</Text>
                <Text style={commonStyles.text}>AI Powered</Text>
              </View>
            </View>
          </View>

          <Button
            text="Start Test"
            onPress={() => setCurrentStep('recording')}
            style={{ marginTop: 20 }}
          />
        </View>
      )}

      {currentStep === 'recording' && (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: colors.text }}>
            {permission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="back"
              >
                <View style={{
                  position: 'absolute',
                  top: 40,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}>
                  <View style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}>
                    <Text style={[commonStyles.title, { color: colors.background }]}>
                      {formatTime(timer)}
                    </Text>
                  </View>
                </View>

                <View style={{
                  position: 'absolute',
                  bottom: 40,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}>
                  <TouchableOpacity
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: isRecording ? colors.error : colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 4,
                      borderColor: colors.background,
                    }}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Icon 
                      name={isRecording ? "stop" : "play"} 
                      size={32} 
                      color={colors.background} 
                    />
                  </TouchableOpacity>
                </View>
              </CameraView>
            ) : (
              <View style={commonStyles.centerContent}>
                <Icon name="camera-outline" size={64} color={colors.textSecondary} />
                <Text style={commonStyles.title}>Camera Permission Required</Text>
                <Text style={commonStyles.textSecondary}>
                  Please grant camera permission to record your test
                </Text>
                <Button
                  text="Grant Permission"
                  onPress={requestPermission}
                  style={{ marginTop: 20 }}
                />
              </View>
            )}
          </View>
        </View>
      )}

      {currentStep === 'review' && recordedVideo && (
        <View style={commonStyles.content}>
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Test Recording</Text>
            <View style={{
              height: 200,
              backgroundColor: colors.text,
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              <Video
                source={{ uri: recordedVideo }}
                style={{ flex: 1 }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
              />
            </View>
            <Text style={commonStyles.textSecondary}>
              Duration: {formatTime(timer)}
            </Text>
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>AI Analysis</Text>
            <Text style={commonStyles.text}>
              Your video is being processed using advanced AI algorithms to analyze your performance. 
              This includes movement detection, form analysis, and performance metrics calculation.
            </Text>
          </View>

          <View style={[commonStyles.row, { marginTop: 20 }]}>
            <Button
              text="Retake"
              onPress={() => {
                setRecordedVideo(null);
                setTimer(0);
                setCurrentStep('recording');
              }}
              style={[{ flex: 1, marginRight: 8 }, { backgroundColor: colors.textSecondary }]}
            />
            <Button
              text="Save Result"
              onPress={saveResult}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
