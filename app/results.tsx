
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Svg, { Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

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

const testNames = {
  'vertical-jump': 'Vertical Jump',
  'shuttle-run': 'Shuttle Run',
  'sit-ups': 'Sit-ups',
  'endurance-run': 'Endurance Run',
  'height-weight': 'Height & Weight',
};

const DonutChart = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth="8"
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={[commonStyles.title, { fontSize: 24, color: getScoreColor(score) }]}>
          {score}
        </Text>
        <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
          SCORE
        </Text>
      </View>
    </View>
  );
};

export default function ResultsScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const resultsData = await AsyncStorage.getItem('testResults');
      const profileData = await AsyncStorage.getItem('userProfile');
      
      if (resultsData) {
        setResults(JSON.parse(resultsData));
      }
      
      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const getOverallScore = () => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / results.length);
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 85) return { level: 'Elite', color: colors.success };
    if (score >= 70) return { level: 'Advanced', color: colors.primary };
    if (score >= 55) return { level: 'Intermediate', color: colors.warning };
    return { level: 'Beginner', color: colors.error };
  };

  const getRecommendations = () => {
    const overallScore = getOverallScore();
    const recommendations = [];

    if (overallScore < 60) {
      recommendations.push('Focus on basic fitness fundamentals');
      recommendations.push('Increase training frequency to 4-5 times per week');
    } else if (overallScore < 80) {
      recommendations.push('Work on sport-specific skills');
      recommendations.push('Consider strength and conditioning programs');
    } else {
      recommendations.push('Maintain current training intensity');
      recommendations.push('Focus on competition preparation');
    }

    // Add specific recommendations based on lowest scoring tests
    const sortedResults = [...results].sort((a, b) => a.score - b.score);
    if (sortedResults.length > 0) {
      const weakestTest = sortedResults[0];
      if (weakestTest.testId === 'vertical-jump') {
        recommendations.push('Include plyometric exercises in training');
      } else if (weakestTest.testId === 'endurance-run') {
        recommendations.push('Increase cardiovascular training volume');
      } else if (weakestTest.testId === 'sit-ups') {
        recommendations.push('Focus on core strengthening exercises');
      }
    }

    return recommendations;
  };

  if (results.length === 0) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Results</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={commonStyles.centerContent}>
          <Icon name="analytics-outline" size={64} color={colors.textSecondary} />
          <Text style={commonStyles.title}>No Results Yet</Text>
          <Text style={commonStyles.textSecondary}>
            Complete some fitness tests to see your results and analysis
          </Text>
          <Button
            text="Start Testing"
            onPress={() => router.push('/')}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const overallScore = getOverallScore();
  const performanceLevel = getPerformanceLevel(overallScore);

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Results & Analytics</Text>
        <TouchableOpacity onPress={() => router.push('/export')}>
          <Icon name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[commonStyles.row, { paddingHorizontal: 20, marginBottom: 16 }]}>
        <TouchableOpacity
          style={[
            { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
            selectedTab === 'overview' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[
            commonStyles.text,
            selectedTab === 'overview' && { color: colors.background, fontWeight: '600' }
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
            selectedTab === 'detailed' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSelectedTab('detailed')}
        >
          <Text style={[
            commonStyles.text,
            selectedTab === 'detailed' && { color: colors.background, fontWeight: '600' }
          ]}>
            Detailed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <View>
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Overall Performance</Text>
              <View style={[commonStyles.row, { marginTop: 16 }]}>
                <DonutChart score={overallScore} size={100} />
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text style={[commonStyles.subtitle, { color: performanceLevel.color }]}>
                    {performanceLevel.level}
                  </Text>
                  <Text style={commonStyles.textSecondary}>Performance Level</Text>
                  <View style={{ marginTop: 12 }}>
                    <Text style={commonStyles.text}>Tests Completed</Text>
                    <Text style={commonStyles.subtitle}>{results.length}/5</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Test Scores</Text>
              {results.map((result) => (
                <View key={result.id} style={[commonStyles.row, { marginBottom: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.text}>
                      {testNames[result.testId as keyof typeof testNames]}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {new Date(result.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[commonStyles.center, { minWidth: 60 }]}>
                    <Text style={[
                      commonStyles.subtitle,
                      { color: result.score >= 70 ? colors.success : colors.warning }
                    ]}>
                      {result.score}
                    </Text>
                    <Text style={commonStyles.textSecondary}>Score</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Recommendations</Text>
              {getRecommendations().map((recommendation, index) => (
                <View key={index} style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
                  <Icon name="checkmark-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'detailed' && (
          <View>
            {results.map((result) => (
              <View key={result.id} style={commonStyles.card}>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.subtitle}>
                      {testNames[result.testId as keyof typeof testNames]}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {new Date(result.timestamp).toLocaleDateString()} at{' '}
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <DonutChart score={result.score} size={60} />
                </View>

                <View style={commonStyles.divider} />

                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                  Measurements
                </Text>
                {Object.entries(result.measurements).map(([key, value]) => (
                  <View key={key} style={[commonStyles.row, { marginBottom: 4 }]}>
                    <Text style={commonStyles.textSecondary}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>
                    <Text style={commonStyles.text}>{value}</Text>
                  </View>
                ))}

                <Text style={[commonStyles.text, { fontWeight: '600', marginTop: 12, marginBottom: 8 }]}>
                  Analysis
                </Text>
                <Text style={commonStyles.text}>{result.analysis}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
