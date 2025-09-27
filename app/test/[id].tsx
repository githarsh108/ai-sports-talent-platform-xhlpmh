
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { commonStyles, colors } from '../../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { videoAnalysisService, VideoAnalysisResult } from '../../services/videoAnalysisService';

const { width, height } = Dimensions.get('window');

interface TestResult {
  id: string;
  testId: string;
  timestamp: number;
  videoUri?: string;
  measurements: any;
  score: number;
  analysis: string;
  confidence?: number;
  detectedMovements?: string[];
  formFeedback?: string[];
  uploadStatus?: 'pending' | 'uploaded' | 'failed';
}

interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  sport: string;
  level: 'beginner' | 'intermediate' | 'advanced';
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
    tips: 'Use your arms for momentum and bend your knees before jumping',
    aiFeatures: ['Jump height detection', 'Form analysis', 'Landing assessment']
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
    tips: 'Focus on quick direction changes and maintain speed',
    aiFeatures: ['Speed tracking', 'Direction change analysis', 'Touch point detection']
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
    tips: 'Keep your core engaged and avoid pulling on your neck',
    aiFeatures: ['Rep counting', 'Form analysis', 'Range of motion tracking']
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
    tips: 'Start at a comfortable pace and maintain it throughout',
    aiFeatures: ['Distance tracking', 'Pace analysis', 'Endurance assessment']
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
    tips: 'Ensure accurate measurements for proper assessment',
    aiFeatures: ['Posture analysis', 'Measurement verification', 'Body composition estimation']
  }
};

export default function TestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'loading' | 'instructions' | 'recording' | 'processing' | 'review'>('loading');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const testConfig = testInstructions[id as keyof typeof testInstructions];

  useEffect(() => {
    checkProfileAndInitialize();
  }, []);

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

  const checkProfileAndInitialize = async () => {
    try {
      console.log('Checking user profile before starting test...');
      const profileData = await AsyncStorage.getItem('userProfile');
      
      if (!profileData) {
        console.log('No profile found, redirecting to profile creation');
        Alert.alert(
          'Profile Required',
          'You need to create your profile before taking fitness assessment tests.',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Create Profile', onPress: () => router.push('/profile') },
          ]
        );
        return;
      }

      const profile = JSON.parse(profileData);
      console.log('Profile loaded for test:', profile);
      
      // Validate profile completeness
      if (!profile.name || !profile.age || !profile.height || !profile.weight || !profile.sport) {
        console.log('Incomplete profile detected');
        Alert.alert(
          'Incomplete Profile',
          'Please complete your profile before taking tests.',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Complete Profile', onPress: () => router.push('/profile') },
          ]
        );
        return;
      }

      setUserProfile(profile);
      setCurrentStep('instructions');
    } catch (error) {
      console.log('Error checking profile:', error);
      Alert.alert(
        'Error',
        'Failed to load your profile. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

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
      console.log('Starting video recording for test:', id);
      setIsRecording(true);
      setIsActive(true);
      setTimer(0);
      setCurrentStep('recording');

      const video = await cameraRef.current?.recordAsync({
        maxDuration: testConfig.duration,
        quality: '720p',
      });

      if (video) {
        console.log('Video recorded successfully:', video.uri);
        setRecordedVideo(video.uri);
        setIsRecording(false);
        setIsActive(false);
        
        // Start AI analysis
        await startVideoAnalysis(video.uri);
      }
    } catch (error) {
      console.log('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
      setIsActive(false);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping video recording');
      setIsRecording(false);
      setIsActive(false);
      await cameraRef.current?.stopRecording();
    } catch (error) {
      console.log('Error stopping recording:', error);
    }
  };

  const startVideoAnalysis = async (videoUri: string) => {
    if (!userProfile) {
      Alert.alert('Error', 'Profile not found. Please create your profile first.');
      return;
    }

    try {
      console.log('Starting AI video analysis...');
      setCurrentStep('processing');
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      // Simulate progress updates
      progressIntervalRef.current = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 95) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Perform actual AI analysis
      const result = await videoAnalysisService.analyzeVideo(videoUri, id as string, userProfile);
      
      // Save video to permanent location
      const savedVideoUri = await videoAnalysisService.saveVideoToLibrary(videoUri, id as string);
      
      setAnalysisProgress(100);
      setAnalysisResult(result);
      setRecordedVideo(savedVideoUri);
      setIsAnalyzing(false);
      setCurrentStep('review');

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      console.log('Video analysis completed successfully');
      
    } catch (error) {
      console.log('Error during video analysis:', error);
      setIsAnalyzing(false);
      setCurrentStep('review');
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      Alert.alert(
        'Analysis Error',
        'Failed to analyze video. You can still save the recording.',
        [{ text: 'OK' }]
      );
    }
  };

  const saveResult = async () => {
    if (!userProfile || !analysisResult) {
      Alert.alert('Error', 'Analysis data not available. Please try again.');
      return;
    }

    try {
      console.log('Saving test result for:', id);
      
      const result: TestResult = {
        id: Date.now().toString(),
        testId: id as string,
        timestamp: Date.now(),
        videoUri: recordedVideo || undefined,
        measurements: analysisResult.measurements,
        score: analysisResult.score,
        analysis: analysisResult.analysis,
        confidence: analysisResult.confidence,
        detectedMovements: analysisResult.detectedMovements,
        formFeedback: analysisResult.formFeedback,
        uploadStatus: 'pending'
      };

      console.log('Generated test result:', result);

      // Save to AsyncStorage
      const existingResults = await AsyncStorage.getItem('testResults');
      const results = existingResults ? JSON.parse(existingResults) : [];
      results.push(result);
      await AsyncStorage.setItem('testResults', JSON.stringify(results));
      console.log('Test result saved to AsyncStorage');

      // Update completed tests
      const completedTests = await AsyncStorage.getItem('completedTests');
      const completed = completedTests ? JSON.parse(completedTests) : [];
      if (!completed.includes(id)) {
        completed.push(id);
        await AsyncStorage.setItem('completedTests', JSON.stringify(completed));
        console.log('Updated completed tests list');
      }

      // Attempt to upload to server
      if (recordedVideo) {
        try {
          const uploadSuccess = await videoAnalysisService.uploadVideoToServer(recordedVideo, result);
          if (uploadSuccess) {
            result.uploadStatus = 'uploaded';
            console.log('Video uploaded to server successfully');
          } else {
            result.uploadStatus = 'failed';
            console.log('Video upload failed');
          }
          
          // Update the result with upload status
          const updatedResults = results.map(r => r.id === result.id ? result : r);
          await AsyncStorage.setItem('testResults', JSON.stringify(updatedResults));
        } catch (uploadError) {
          console.log('Upload error:', uploadError);
          result.uploadStatus = 'failed';
        }
      }

      Alert.alert(
        'Test Completed!',
        `Your ${testConfig.title} has been analyzed and saved.\n\nScore: ${analysisResult.score}/100\nConfidence: ${analysisResult.confidence}%\n\n${analysisResult.analysis}`,
        [
          { text: 'View Results', onPress: () => router.push('/results') },
          { text: 'Back to Home', onPress: () => router.push('/') },
        ]
      );
    } catch (error) {
      console.log('Error saving result:', error);
      Alert.alert('Error', 'Failed to save test result. Please try again.');
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
        <Icon name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={commonStyles.title}>Test Not Found</Text>
        <Text style={commonStyles.textSecondary}>The requested test could not be found.</Text>
        <Button text="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  if (currentStep === 'loading') {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[commonStyles.title, { marginTop: 20 }]}>Preparing Test</Text>
        <Text style={commonStyles.textSecondary}>Loading your profile and test configuration...</Text>
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
          {userProfile && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Athlete Profile</Text>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Text style={commonStyles.text}>Name:</Text>
                <Text style={commonStyles.text}>{userProfile.name}</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Text style={commonStyles.text}>Sport:</Text>
                <Text style={commonStyles.text}>{userProfile.sport}</Text>
              </View>
              <View style={commonStyles.row}>
                <Text style={commonStyles.text}>Level:</Text>
                <Text style={commonStyles.text}>
                  {userProfile.level.charAt(0).toUpperCase() + userProfile.level.slice(1)}
                </Text>
              </View>
            </View>
          )}

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>AI-Powered Analysis</Text>
            <Text style={commonStyles.text}>This test uses advanced AI to analyze your performance:</Text>
            {testConfig.aiFeatures.map((feature, index) => (
              <View key={index} style={[commonStyles.row, { marginTop: 8, alignItems: 'flex-start' }]}>
                <Icon name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[commonStyles.textSecondary, { flex: 1 }]}>{feature}</Text>
              </View>
            ))}
          </View>

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
                <Text style={commonStyles.text}>HD Quality</Text>
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
                    <Text style={[commonStyles.textSecondary, { color: colors.background, textAlign: 'center' }]}>
                      {isRecording ? 'Recording...' : 'Ready to Record'}
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

      {currentStep === 'processing' && (
        <View style={commonStyles.centerContent}>
          <View style={commonStyles.card}>
            <View style={commonStyles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[commonStyles.title, { marginTop: 20 }]}>AI Analysis in Progress</Text>
              <Text style={commonStyles.textSecondary}>
                Analyzing your video using advanced AI algorithms...
              </Text>
              
              <View style={{
                width: '100%',
                height: 8,
                backgroundColor: colors.border,
                borderRadius: 4,
                marginTop: 20,
                overflow: 'hidden'
              }}>
                <View style={{
                  width: `${analysisProgress}%`,
                  height: '100%',
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                }} />
              </View>
              
              <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                {Math.round(analysisProgress)}% Complete
              </Text>
            </View>
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Processing Steps</Text>
            <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
              <Icon name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[commonStyles.textSecondary, { flex: 1 }]}>Video quality verification</Text>
            </View>
            <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
              <Icon name={analysisProgress > 30 ? "checkmark-circle" : "ellipse-outline"} size={16} color={analysisProgress > 30 ? colors.success : colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[commonStyles.textSecondary, { flex: 1 }]}>Movement pattern detection</Text>
            </View>
            <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
              <Icon name={analysisProgress > 60 ? "checkmark-circle" : "ellipse-outline"} size={16} color={analysisProgress > 60 ? colors.success : colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[commonStyles.textSecondary, { flex: 1 }]}>Performance measurement</Text>
            </View>
            <View style={[commonStyles.row, { alignItems: 'flex-start' }]}>
              <Icon name={analysisProgress > 90 ? "checkmark-circle" : "ellipse-outline"} size={16} color={analysisProgress > 90 ? colors.success : colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[commonStyles.textSecondary, { flex: 1 }]}>Score calculation & feedback</Text>
            </View>
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

          {analysisResult && (
            <>
              <View style={commonStyles.card}>
                <Text style={commonStyles.sectionTitle}>AI Analysis Results</Text>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <Text style={commonStyles.text}>Score:</Text>
                  <Text style={[commonStyles.text, { color: analysisResult.score > 75 ? colors.success : analysisResult.score > 60 ? colors.warning : colors.error }]}>
                    {analysisResult.score}/100
                  </Text>
                </View>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <Text style={commonStyles.text}>Confidence:</Text>
                  <Text style={commonStyles.text}>{analysisResult.confidence}%</Text>
                </View>
                <Text style={commonStyles.text}>{analysisResult.analysis}</Text>
              </View>

              {analysisResult.detectedMovements && analysisResult.detectedMovements.length > 0 && (
                <View style={commonStyles.card}>
                  <Text style={commonStyles.sectionTitle}>Detected Movements</Text>
                  {analysisResult.detectedMovements.map((movement, index) => (
                    <View key={index} style={[commonStyles.row, { marginBottom: 4, alignItems: 'flex-start' }]}>
                      <Icon name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8, marginTop: 2 }} />
                      <Text style={[commonStyles.textSecondary, { flex: 1 }]}>{movement}</Text>
                    </View>
                  ))}
                </View>
              )}

              {analysisResult.formFeedback && analysisResult.formFeedback.length > 0 && (
                <View style={commonStyles.card}>
                  <Text style={commonStyles.sectionTitle}>Form Feedback</Text>
                  {analysisResult.formFeedback.map((feedback, index) => (
                    <View key={index} style={[commonStyles.row, { marginBottom: 4, alignItems: 'flex-start' }]}>
                      <Icon name="bulb-outline" size={16} color={colors.warning} style={{ marginRight: 8, marginTop: 2 }} />
                      <Text style={[commonStyles.textSecondary, { flex: 1 }]}>{feedback}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={[commonStyles.row, { marginTop: 20 }]}>
            <Button
              text="Retake"
              onPress={() => {
                setRecordedVideo(null);
                setAnalysisResult(null);
                setTimer(0);
                setCurrentStep('recording');
              }}
              style={[{ flex: 1, marginRight: 8 }, { backgroundColor: colors.textSecondary }]}
            />
            <Button
              text="Save Result"
              onPress={saveResult}
              style={{ flex: 1, marginLeft: 8 }}
              disabled={!analysisResult}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
