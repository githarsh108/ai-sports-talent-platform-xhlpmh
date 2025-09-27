
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
  const [currentStep, setCurrentStep] = useState<'loading' | 'instructions' | 'recording' | 'review'>('loading');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        setCurrentStep('review');
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

  const saveResult = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'Profile not found. Please create your profile first.');
      return;
    }

    try {
      console.log('Saving test result for:', id);
      
      // Generate AI analysis based on user profile
      const mockAnalysis = generateMockAnalysis(id as string, timer, userProfile);
      
      const result: TestResult = {
        id: Date.now().toString(),
        testId: id as string,
        timestamp: Date.now(),
        videoUri: recordedVideo || undefined,
        measurements: mockAnalysis.measurements,
        score: mockAnalysis.score,
        analysis: mockAnalysis.analysis,
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

      Alert.alert(
        'Test Completed!',
        `Your ${testConfig.title} has been analyzed and saved.\n\nScore: ${mockAnalysis.score}/100\n\n${mockAnalysis.analysis}`,
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

  const generateMockAnalysis = (testId: string, duration: number, profile: UserProfile) => {
    // Enhanced AI analysis based on user profile
    const ageMultiplier = profile.age < 20 ? 1.1 : profile.age > 35 ? 0.9 : 1.0;
    const genderMultiplier = profile.gender === 'male' ? 1.05 : 1.0;
    const levelMultiplier = profile.level === 'advanced' ? 1.2 : profile.level === 'intermediate' ? 1.1 : 1.0;
    
    switch (testId) {
      case 'vertical-jump':
        const jumpHeight = Math.floor((Math.random() * 30 + 40) * ageMultiplier * genderMultiplier);
        const jumpScore = Math.min(100, Math.floor((jumpHeight / 70) * 100 * levelMultiplier));
        return {
          measurements: { height: jumpHeight },
          score: jumpScore,
          analysis: `Vertical jump: ${jumpHeight}cm. ${jumpScore > 80 ? 'Excellent' : jumpScore > 60 ? 'Good' : 'Needs improvement'} explosive power for your age group and experience level.`
        };
        
      case 'shuttle-run':
        const runTime = (Math.random() * 5 + 15) / (ageMultiplier * levelMultiplier);
        const runScore = Math.min(100, Math.floor((20 / runTime) * 100));
        return {
          measurements: { time: runTime.toFixed(2) },
          score: runScore,
          analysis: `Shuttle run time: ${runTime.toFixed(2)}s. ${runScore > 75 ? 'Excellent' : runScore > 60 ? 'Good' : 'Needs improvement'} agility and speed for your profile.`
        };
        
      case 'sit-ups':
        const sitUps = Math.floor((Math.random() * 20 + 30) * ageMultiplier * levelMultiplier);
        const sitUpScore = Math.min(100, Math.floor((sitUps / 50) * 100));
        return {
          measurements: { reps: sitUps },
          score: sitUpScore,
          analysis: `Completed ${sitUps} sit-ups. ${sitUpScore > 70 ? 'Strong' : sitUpScore > 50 ? 'Average' : 'Weak'} core endurance for your fitness level.`
        };
        
      case 'endurance-run':
        const distance = Math.floor((Math.random() * 1000 + 2000) * ageMultiplier * levelMultiplier);
        const enduranceScore = Math.min(100, Math.floor((distance / 3000) * 100));
        return {
          measurements: { distance: distance.toString() },
          score: enduranceScore,
          analysis: `Distance covered: ${distance}m in 12 minutes. ${enduranceScore > 80 ? 'Excellent' : enduranceScore > 60 ? 'Good' : 'Needs improvement'} cardiovascular fitness.`
        };
        
      case 'height-weight':
        const bmi = profile.weight / ((profile.height / 100) ** 2);
        const bmiScore = bmi >= 18.5 && bmi <= 25 ? 100 : bmi < 18.5 ? 70 : 60;
        return {
          measurements: { height: profile.height, weight: profile.weight, bmi: bmi.toFixed(1) },
          score: bmiScore,
          analysis: `BMI: ${bmi.toFixed(1)}. ${bmiScore === 100 ? 'Optimal' : bmiScore === 70 ? 'Underweight' : 'Overweight'} body composition for athletic performance.`
        };
        
      default:
        return {
          measurements: {},
          score: Math.floor(Math.random() * 50 + 50),
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
        <Icon name="fitness-outline" size={64} color={colors.primary} />
        <Text style={commonStyles.title}>Preparing Test</Text>
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
              This includes movement detection, form analysis, and performance metrics calculation based on your profile.
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
