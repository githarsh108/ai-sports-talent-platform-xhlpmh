
import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const onboardingSteps = [
  {
    title: 'Welcome to SAI Talent Scout',
    description: 'Democratizing sports talent assessment across India with AI-powered video analysis',
    icon: 'trophy',
    color: colors.primary,
  },
  {
    title: 'Record Your Performance',
    description: 'Use your smartphone to record standardized fitness tests including vertical jump, shuttle run, and more',
    icon: 'videocam',
    color: colors.secondary,
  },
  {
    title: 'AI-Powered Analysis',
    description: 'Our advanced AI analyzes your videos for accuracy, detects cheating, and provides detailed performance metrics',
    icon: 'analytics',
    color: colors.success,
  },
  {
    title: 'Get Discovered',
    description: 'Submit your verified results to Sports Authority of India and compete on national leaderboards',
    icon: 'rocket',
    color: colors.warning,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/');
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  const step = onboardingSteps[currentStep];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <View style={{ width: 24 }} />
        <Text style={commonStyles.headerTitle}>
          {currentStep + 1} of {onboardingSteps.length}
        </Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[commonStyles.text, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={[commonStyles.centerContent, { paddingTop: 40 }]}>
          <View style={[
            commonStyles.center,
            {
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: step.color + '20',
              marginBottom: 40,
            }
          ]}>
            <Icon name={step.icon as any} size={60} color={step.color} />
          </View>

          <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 20 }]}>
            {step.title}
          </Text>

          <Text style={[
            commonStyles.text,
            { 
              textAlign: 'center', 
              lineHeight: 28,
              paddingHorizontal: 20,
              marginBottom: 40,
            }
          ]}>
            {step.description}
          </Text>

          {currentStep === 0 && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Key Features</Text>
              <View style={[commonStyles.row, { marginBottom: 12, alignItems: 'flex-start' }]}>
                <Icon name="checkmark-circle" size={20} color={colors.success} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 12 }]}>
                  Standardized fitness assessment tests
                </Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 12, alignItems: 'flex-start' }]}>
                <Icon name="checkmark-circle" size={20} color={colors.success} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 12 }]}>
                  AI-based cheat detection and verification
                </Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 12, alignItems: 'flex-start' }]}>
                <Icon name="checkmark-circle" size={20} color={colors.success} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 12 }]}>
                  Offline video analysis capabilities
                </Text>
              </View>
              <View style={[commonStyles.row, { alignItems: 'flex-start' }]}>
                <Icon name="checkmark-circle" size={20} color={colors.success} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 12 }]}>
                  Secure data submission to SAI
                </Text>
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Available Tests</Text>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Icon name="arrow-up-circle" size={16} color={colors.primary} />
                <Text style={[commonStyles.text, { marginLeft: 8 }]}>Vertical Jump</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Icon name="flash" size={16} color={colors.primary} />
                <Text style={[commonStyles.text, { marginLeft: 8 }]}>Shuttle Run</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Icon name="fitness" size={16} color={colors.primary} />
                <Text style={[commonStyles.text, { marginLeft: 8 }]}>Sit-ups</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Icon name="walk" size={16} color={colors.primary} />
                <Text style={[commonStyles.text, { marginLeft: 8 }]}>Endurance Run</Text>
              </View>
              <View style={commonStyles.row}>
                <Icon name="body" size={16} color={colors.primary} />
                <Text style={[commonStyles.text, { marginLeft: 8 }]}>Height & Weight</Text>
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>AI Analysis Features</Text>
              <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
                <Icon name="eye" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
                  Movement detection and form analysis
                </Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
                <Icon name="shield-checkmark" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
                  Cheat detection and authenticity verification
                </Text>
              </View>
              <View style={[commonStyles.row, { alignItems: 'flex-start' }]}>
                <Icon name="speedometer" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
                  Performance metrics and benchmarking
                </Text>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Get Started</Text>
              <Text style={commonStyles.text}>
                Ready to showcase your athletic potential? Create your profile and start your first fitness assessment to join thousands of aspiring athletes across India.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <View style={[commonStyles.row, { marginBottom: 20 }]}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                backgroundColor: index <= currentStep ? colors.primary : colors.border,
                marginHorizontal: 2,
                borderRadius: 2,
              }}
            />
          ))}
        </View>

        <Button
          text={currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}
