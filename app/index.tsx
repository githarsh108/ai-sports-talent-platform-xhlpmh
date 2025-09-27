
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import Button from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  sport: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

const fitnessTests = [
  {
    id: 'vertical-jump',
    title: 'Vertical Jump',
    description: 'Measure your explosive leg power',
    icon: 'arrow-up-circle-outline',
    duration: '2 min',
    difficulty: 'Medium',
  },
  {
    id: 'shuttle-run',
    title: 'Shuttle Run',
    description: 'Test your agility and speed',
    icon: 'flash-outline',
    duration: '3 min',
    difficulty: 'Hard',
  },
  {
    id: 'sit-ups',
    title: 'Sit-ups',
    description: 'Core strength assessment',
    icon: 'fitness-outline',
    duration: '1 min',
    difficulty: 'Easy',
  },
  {
    id: 'endurance-run',
    title: 'Endurance Run',
    description: 'Cardiovascular fitness test',
    icon: 'walk-outline',
    duration: '12 min',
    difficulty: 'Hard',
  },
  {
    id: 'height-weight',
    title: 'Height & Weight',
    description: 'Basic anthropometric measurements',
    icon: 'body-outline',
    duration: '1 min',
    difficulty: 'Easy',
  },
];

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [completedTests, setCompletedTests] = useState<string[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      const testsData = await AsyncStorage.getItem('completedTests');
      
      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      }
      
      if (testsData) {
        setCompletedTests(JSON.parse(testsData));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleTestPress = (testId: string) => {
    if (!userProfile) {
      Alert.alert(
        'Profile Required',
        'Please create your profile first to start assessments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Profile', onPress: () => router.push('/profile') },
        ]
      );
      return;
    }

    router.push(`/test/${testId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success;
      case 'Medium': return colors.warning;
      case 'Hard': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getProgressPercentage = () => {
    return Math.round((completedTests.length / fitnessTests.length) * 100);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <View>
          <Text style={commonStyles.headerTitle}>SAI Talent Scout</Text>
          <Text style={commonStyles.textSecondary}>Sports Authority of India</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Icon 
            name={userProfile ? "person-circle" : "person-add"} 
            size={32} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        {userProfile && (
          <View style={commonStyles.card}>
            <View style={commonStyles.row}>
              <View>
                <Text style={commonStyles.subtitle}>Welcome back, {userProfile.name}!</Text>
                <Text style={commonStyles.textSecondary}>
                  Progress: {getProgressPercentage()}% Complete
                </Text>
              </View>
              <View style={commonStyles.badge}>
                <Text style={commonStyles.badgeText}>
                  {completedTests.length}/{fitnessTests.length}
                </Text>
              </View>
            </View>
            
            <View style={[commonStyles.row, { marginTop: 16 }]}>
              <View style={{ flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                <View 
                  style={{
                    width: `${getProgressPercentage()}%`,
                    height: '100%',
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
        )}

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Fitness Assessment Tests</Text>
          <Text style={commonStyles.textSecondary}>
            Complete all tests to get your comprehensive sports talent assessment
          </Text>
        </View>

        {fitnessTests.map((test) => {
          const isCompleted = completedTests.includes(test.id);
          
          return (
            <TouchableOpacity
              key={test.id}
              style={[
                commonStyles.card,
                isCompleted && { borderColor: colors.success, borderWidth: 2 }
              ]}
              onPress={() => handleTestPress(test.id)}
            >
              <View style={commonStyles.row}>
                <Icon 
                  name={test.icon as any} 
                  size={24} 
                  color={isCompleted ? colors.success : colors.primary} 
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <View style={commonStyles.row}>
                    <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                      {test.title}
                    </Text>
                    {isCompleted && (
                      <Icon name="checkmark-circle" size={20} color={colors.success} />
                    )}
                  </View>
                  <Text style={commonStyles.textSecondary}>{test.description}</Text>
                  
                  <View style={[commonStyles.row, { marginTop: 8 }]}>
                    <View style={[commonStyles.badge, { backgroundColor: getDifficultyColor(test.difficulty) }]}>
                      <Text style={commonStyles.badgeText}>{test.difficulty}</Text>
                    </View>
                    <Text style={[commonStyles.textSecondary, { marginLeft: 12 }]}>
                      {test.duration}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={commonStyles.section}>
          <Button
            text="View Results & Analytics"
            onPress={() => router.push('/results')}
            style={[
              { opacity: completedTests.length === 0 ? 0.5 : 1 },
              { marginBottom: 16 }
            ]}
            disabled={completedTests.length === 0}
          />
          
          <Button
            text="Leaderboard"
            onPress={() => router.push('/leaderboard')}
            style={{ backgroundColor: colors.secondary }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
