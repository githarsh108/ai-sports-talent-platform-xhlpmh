
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

const DonutChart = ({ score, size = 120 }: { score: number; size?: number }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={[commonStyles.title, { fontSize: 24, color: getScoreColor(score) }]}>
          {score}
        </Text>
        <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
          /100
        </Text>
      </View>
    </View>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
};

export default function ResultsScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading results and profile data...');
      
      const [resultsData, profileData] = await Promise.all([
        AsyncStorage.getItem('testResults'),
        AsyncStorage.getItem('userProfile')
      ]);

      if (resultsData) {
        const parsedResults = JSON.parse(resultsData);
        console.log('Loaded test results:', parsedResults);
        setResults(parsedResults);
      }

      if (profileData) {
        const parsedProfile = JSON.parse(profileData);
        console.log('Loaded user profile:', parsedProfile);
        setProfile(parsedProfile);
      }

      setLoading(false);
    } catch (error) {
      console.log('Error loading data:', error);
      setLoading(false);
    }
  };

  const getOverallScore = () => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / results.length);
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  const getRecommendations = () => {
    const overallScore = getOverallScore();
    const recommendations = [];

    if (overallScore < 60) {
      recommendations.push('Focus on basic fitness fundamentals');
      recommendations.push('Increase training frequency');
      recommendations.push('Work with a fitness coach');
    } else if (overallScore < 80) {
      recommendations.push('Target specific weak areas');
      recommendations.push('Increase training intensity');
      recommendations.push('Add sport-specific drills');
    } else {
      recommendations.push('Maintain current training level');
      recommendations.push('Focus on competition preparation');
      recommendations.push('Consider advanced training techniques');
    }

    return recommendations;
  };

  const getTestName = (testId: string) => {
    const testNames = {
      'vertical-jump': 'Vertical Jump',
      'shuttle-run': 'Shuttle Run',
      'sit-ups': 'Sit-ups',
      'endurance-run': 'Endurance Run',
      'height-weight': 'Height & Weight'
    };
    return testNames[testId as keyof typeof testNames] || testId;
  };

  const getUploadStatusIcon = (status?: string) => {
    switch (status) {
      case 'uploaded':
        return <Icon name="cloud-done-outline" size={16} color={colors.success} />;
      case 'failed':
        return <Icon name="cloud-offline-outline" size={16} color={colors.error} />;
      case 'pending':
      default:
        return <Icon name="cloud-upload-outline" size={16} color={colors.warning} />;
    }
  };

  const getUploadStatusText = (status?: string) => {
    switch (status) {
      case 'uploaded':
        return 'Uploaded to SAI';
      case 'failed':
        return 'Upload Failed';
      case 'pending':
      default:
        return 'Upload Pending';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Icon name="analytics-outline" size={64} color={colors.primary} />
        <Text style={commonStyles.title}>Loading Results</Text>
        <Text style={commonStyles.textSecondary}>Analyzing your performance data...</Text>
      </SafeAreaView>
    );
  }

  if (results.length === 0) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Icon name="bar-chart-outline" size={64} color={colors.textSecondary} />
        <Text style={commonStyles.title}>No Results Yet</Text>
        <Text style={commonStyles.textSecondary}>
          Complete some fitness assessment tests to see your results here.
        </Text>
        <Button
          text="Take a Test"
          onPress={() => router.push('/')}
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Results</Text>
        <TouchableOpacity onPress={() => router.push('/export')}>
          <Icon name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content}>
        {profile && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Performance Overview</Text>
            <View style={commonStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.text}>{profile.name}</Text>
                <Text style={commonStyles.textSecondary}>{profile.sport} • {profile.level}</Text>
                <Text style={[commonStyles.text, { marginTop: 8 }]}>
                  Overall Score: {getPerformanceLevel(getOverallScore())}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Based on {results.length} test{results.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <DonutChart score={getOverallScore()} />
            </View>
          </View>
        )}

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Test Results</Text>
          {results.map((result, index) => (
            <View key={result.id} style={[
              commonStyles.row,
              { 
                marginBottom: index < results.length - 1 ? 16 : 0,
                alignItems: 'flex-start',
                paddingBottom: index < results.length - 1 ? 16 : 0,
                borderBottomWidth: index < results.length - 1 ? 1 : 0,
                borderBottomColor: colors.border
              }
            ]}>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.text}>{getTestName(result.testId)}</Text>
                <Text style={commonStyles.textSecondary}>
                  {new Date(result.timestamp).toLocaleDateString()}
                </Text>
                {result.confidence && (
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    AI Confidence: {result.confidence}%
                  </Text>
                )}
                <View style={[commonStyles.row, { marginTop: 4, alignItems: 'center' }]}>
                  {getUploadStatusIcon(result.uploadStatus)}
                  <Text style={[commonStyles.textSecondary, { fontSize: 12, marginLeft: 4 }]}>
                    {getUploadStatusText(result.uploadStatus)}
                  </Text>
                </View>
              </View>
              <View style={commonStyles.center}>
                <DonutChart score={result.score} size={60} />
              </View>
            </View>
          ))}
        </View>

        {results.some(r => r.detectedMovements && r.detectedMovements.length > 0) && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>AI Analysis Summary</Text>
            <Text style={commonStyles.text}>
              Advanced AI has analyzed your movements and provided detailed feedback:
            </Text>
            {results.filter(r => r.detectedMovements && r.detectedMovements.length > 0).map((result, index) => (
              <View key={result.id} style={{ marginTop: 12 }}>
                <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                  {getTestName(result.testId)}
                </Text>
                {result.detectedMovements?.slice(0, 2).map((movement, idx) => (
                  <View key={idx} style={[commonStyles.row, { marginTop: 4, alignItems: 'flex-start' }]}>
                    <Icon name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={[commonStyles.textSecondary, { flex: 1, fontSize: 13 }]}>{movement}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Recommendations</Text>
          {getRecommendations().map((recommendation, index) => (
            <View key={index} style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
              <Icon name="bulb-outline" size={16} color={colors.warning} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[commonStyles.textSecondary, { flex: 1 }]}>{recommendation}</Text>
            </View>
          ))}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Data Upload Status</Text>
          <Text style={commonStyles.text}>
            Your test data is being securely transmitted to the Sports Authority of India (SAI) for official evaluation.
          </Text>
          <View style={{ marginTop: 12 }}>
            <View style={[commonStyles.row, { marginBottom: 8 }]}>
              <Text style={commonStyles.textSecondary}>Uploaded:</Text>
              <Text style={[commonStyles.text, { color: colors.success }]}>
                {results.filter(r => r.uploadStatus === 'uploaded').length}
              </Text>
            </View>
            <View style={[commonStyles.row, { marginBottom: 8 }]}>
              <Text style={commonStyles.textSecondary}>Pending:</Text>
              <Text style={[commonStyles.text, { color: colors.warning }]}>
                {results.filter(r => r.uploadStatus === 'pending' || !r.uploadStatus).length}
              </Text>
            </View>
            <View style={commonStyles.row}>
              <Text style={commonStyles.textSecondary}>Failed:</Text>
              <Text style={[commonStyles.text, { color: colors.error }]}>
                {results.filter(r => r.uploadStatus === 'failed').length}
              </Text>
            </View>
          </View>
        </View>

        <View style={[commonStyles.row, { marginTop: 20, marginBottom: 40 }]}>
          <Button
            text="Export Report"
            onPress={() => router.push('/export')}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            text="Take More Tests"
            onPress={() => router.push('/')}
            style={[{ flex: 1, marginLeft: 8 }, { backgroundColor: colors.secondary }]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
