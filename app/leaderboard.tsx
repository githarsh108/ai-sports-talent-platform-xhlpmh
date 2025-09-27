
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../components/Icon';

interface LeaderboardEntry {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  sport: string;
  overallScore: number;
  testScores: { [key: string]: number };
  rank: number;
}

// Mock leaderboard data - in a real app, this would come from a backend
const generateMockLeaderboard = (): LeaderboardEntry[] => {
  const names = [
    'Arjun Sharma', 'Priya Patel', 'Rohit Kumar', 'Sneha Singh', 'Vikram Rao',
    'Anita Gupta', 'Rajesh Verma', 'Kavya Nair', 'Suresh Reddy', 'Meera Joshi',
    'Amit Agarwal', 'Pooja Mehta', 'Kiran Desai', 'Ravi Iyer', 'Sita Yadav'
  ];
  
  const sports = ['Athletics', 'Badminton', 'Basketball', 'Cricket', 'Football', 'Hockey'];
  
  return names.map((name, index) => ({
    id: `user_${index}`,
    name,
    age: Math.floor(Math.random() * 20) + 16,
    gender: Math.random() > 0.5 ? 'male' : 'female',
    sport: sports[Math.floor(Math.random() * sports.length)],
    overallScore: Math.floor(Math.random() * 40) + 60,
    testScores: {
      'vertical-jump': Math.floor(Math.random() * 40) + 60,
      'shuttle-run': Math.floor(Math.random() * 40) + 60,
      'sit-ups': Math.floor(Math.random() * 40) + 60,
      'endurance-run': Math.floor(Math.random() * 40) + 60,
    },
    rank: index + 1,
  })).sort((a, b) => b.overallScore - a.overallScore).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'age' | 'sport'>('overall');
  const [selectedSport, setSelectedSport] = useState<string>('All');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // Generate mock data
      const mockData = generateMockLeaderboard();
      setLeaderboard(mockData);

      // Try to find user's position
      const profileData = await AsyncStorage.getItem('userProfile');
      const resultsData = await AsyncStorage.getItem('testResults');
      
      if (profileData && resultsData) {
        const profile = JSON.parse(profileData);
        const results = JSON.parse(resultsData);
        
        if (results.length > 0) {
          const overallScore = Math.round(
            results.reduce((sum: number, result: any) => sum + result.score, 0) / results.length
          );
          
          const userEntry: LeaderboardEntry = {
            id: 'current_user',
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            sport: profile.sport,
            overallScore,
            testScores: {},
            rank: mockData.filter(entry => entry.overallScore > overallScore).length + 1,
          };
          
          setUserRank(userEntry);
        }
      }
    } catch (error) {
      console.log('Error loading leaderboard:', error);
    }
  };

  const getFilteredLeaderboard = () => {
    let filtered = [...leaderboard];
    
    if (selectedSport !== 'All') {
      filtered = filtered.filter(entry => entry.sport === selectedSport);
    }
    
    return filtered;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { icon: 'trophy', color: '#FFD700' };
      case 2: return { icon: 'medal', color: '#C0C0C0' };
      case 3: return { icon: 'medal', color: '#CD7F32' };
      default: return { icon: 'person', color: colors.textSecondary };
    }
  };

  const sports = ['All', 'Athletics', 'Badminton', 'Basketball', 'Cricket', 'Football', 'Hockey'];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Leaderboard</Text>
        <Icon name="trophy" size={24} color={colors.warning} />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={commonStyles.row}>
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                  selectedSport === sport && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  }
                ]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text style={[
                  commonStyles.text,
                  { fontSize: 14 },
                  selectedSport === sport && { color: colors.background, fontWeight: '600' }
                ]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {userRank && (
        <View style={[commonStyles.card, { marginHorizontal: 20, marginBottom: 16 }]}>
          <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>Your Ranking</Text>
          <View style={commonStyles.row}>
            <View style={[commonStyles.center, { 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: colors.primary 
            }]}>
              <Text style={[commonStyles.text, { color: colors.background, fontWeight: '600' }]}>
                #{userRank.rank}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={commonStyles.text}>{userRank.name}</Text>
              <Text style={commonStyles.textSecondary}>{userRank.sport}</Text>
            </View>
            <View style={commonStyles.center}>
              <Text style={[commonStyles.subtitle, { color: colors.primary }]}>
                {userRank.overallScore}
              </Text>
              <Text style={commonStyles.textSecondary}>Score</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Top Athletes</Text>
          
          {getFilteredLeaderboard().slice(0, 50).map((entry, index) => {
            const rankInfo = getRankIcon(entry.rank);
            const isCurrentUser = userRank && entry.name === userRank.name;
            
            return (
              <View
                key={entry.id}
                style={[
                  commonStyles.row,
                  { 
                    paddingVertical: 12,
                    borderBottomWidth: index < 49 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                  isCurrentUser && {
                    backgroundColor: colors.accent + '20',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    marginHorizontal: -12,
                  }
                ]}
              >
                <View style={[commonStyles.center, { width: 40 }]}>
                  {entry.rank <= 3 ? (
                    <Icon name={rankInfo.icon as any} size={24} color={rankInfo.color} />
                  ) : (
                    <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                      #{entry.rank}
                    </Text>
                  )}
                </View>
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[
                    commonStyles.text,
                    { fontWeight: isCurrentUser ? '600' : '400' }
                  ]}>
                    {entry.name}
                    {isCurrentUser && (
                      <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}> (You)</Text>
                    )}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {entry.sport} • {entry.age} years • {entry.gender}
                  </Text>
                </View>
                
                <View style={commonStyles.center}>
                  <Text style={[
                    commonStyles.subtitle,
                    { 
                      color: entry.rank <= 3 ? rankInfo.color : colors.primary,
                      fontSize: 18,
                    }
                  ]}>
                    {entry.overallScore}
                  </Text>
                  <Text style={commonStyles.textSecondary}>Score</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>How Rankings Work</Text>
          <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
            <Icon name="information-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
              Rankings are based on overall performance across all completed fitness tests
            </Text>
          </View>
          <View style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
            <Icon name="analytics" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
              Scores are calculated using AI analysis of your recorded performances
            </Text>
          </View>
          <View style={[commonStyles.row, { alignItems: 'flex-start' }]}>
            <Icon name="refresh" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[commonStyles.text, { flex: 1, marginLeft: 8 }]}>
              Rankings are updated in real-time as new tests are completed
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
