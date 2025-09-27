
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
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

const sports = [
  'Athletics', 'Badminton', 'Basketball', 'Boxing', 'Cricket', 
  'Football', 'Hockey', 'Swimming', 'Tennis', 'Volleyball', 'Wrestling'
];

const levels = ['beginner', 'intermediate', 'advanced'];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 0,
    gender: 'male',
    height: 0,
    weight: 0,
    sport: '',
    level: 'beginner',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (profileData) {
        setProfile(JSON.parse(profileData));
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
      setIsEditing(true);
    }
  };

  const saveProfile = async () => {
    if (!profile.name || !profile.age || !profile.height || !profile.weight || !profile.sport) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (profile.age < 10 || profile.age > 50) {
      Alert.alert('Error', 'Age must be between 10 and 50 years');
      return;
    }

    if (profile.height < 100 || profile.height > 250) {
      Alert.alert('Error', 'Height must be between 100 and 250 cm');
      return;
    }

    if (profile.weight < 30 || profile.weight > 150) {
      Alert.alert('Error', 'Weight must be between 30 and 150 kg');
      return;
    }

    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const getBMI = () => {
    if (profile.height && profile.weight) {
      const heightInM = profile.height / 100;
      return (profile.weight / (heightInM * heightInM)).toFixed(1);
    }
    return '0';
  };

  const getBMICategory = () => {
    const bmi = parseFloat(getBMI());
    if (bmi < 18.5) return { category: 'Underweight', color: colors.warning };
    if (bmi < 25) return { category: 'Normal', color: colors.success };
    if (bmi < 30) return { category: 'Overweight', color: colors.warning };
    return { category: 'Obese', color: colors.error };
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Icon name={isEditing ? "close" : "create"} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={commonStyles.card}>
          <View style={[commonStyles.row, { marginBottom: 20 }]}>
            <View style={[commonStyles.center, { 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: colors.primary 
            }]}>
              <Icon name="person" size={40} color={colors.background} />
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Text style={commonStyles.subtitle}>
                {profile.name || 'New Athlete'}
              </Text>
              <Text style={commonStyles.textSecondary}>
                {profile.sport || 'Select your sport'}
              </Text>
            </View>
          </View>

          {!isEditing && profile.height && profile.weight && (
            <View style={[commonStyles.row, { marginBottom: 16 }]}>
              <View style={commonStyles.center}>
                <Text style={commonStyles.text}>BMI</Text>
                <Text style={[commonStyles.subtitle, { color: getBMICategory().color }]}>
                  {getBMI()}
                </Text>
                <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                  {getBMICategory().category}
                </Text>
              </View>
              <View style={commonStyles.center}>
                <Text style={commonStyles.text}>Age</Text>
                <Text style={commonStyles.subtitle}>{profile.age}</Text>
                <Text style={commonStyles.textSecondary}>years</Text>
              </View>
              <View style={commonStyles.center}>
                <Text style={commonStyles.text}>Level</Text>
                <Text style={commonStyles.subtitle}>{profile.level}</Text>
              </View>
            </View>
          )}
        </View>

        {isEditing ? (
          <View>
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Personal Information</Text>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={[commonStyles.text, { marginBottom: 8 }]}>Full Name *</Text>
                <TextInput
                  style={commonStyles.input}
                  value={profile.name}
                  onChangeText={(text) => setProfile({ ...profile, name: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[commonStyles.row, { marginBottom: 16 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>Age *</Text>
                  <TextInput
                    style={commonStyles.input}
                    value={profile.age ? profile.age.toString() : ''}
                    onChangeText={(text) => setProfile({ ...profile, age: parseInt(text) || 0 })}
                    placeholder="Age"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>Gender *</Text>
                  <View style={commonStyles.row}>
                    <TouchableOpacity
                      style={[
                        buttonStyles.outline,
                        { flex: 1, marginRight: 4, paddingVertical: 8 },
                        profile.gender === 'male' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setProfile({ ...profile, gender: 'male' })}
                    >
                      <Text style={[
                        buttonStyles.outlineText,
                        profile.gender === 'male' && { color: colors.background }
                      ]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        buttonStyles.outline,
                        { flex: 1, marginLeft: 4, paddingVertical: 8 },
                        profile.gender === 'female' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setProfile({ ...profile, gender: 'female' })}
                    >
                      <Text style={[
                        buttonStyles.outlineText,
                        profile.gender === 'female' && { color: colors.background }
                      ]}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[commonStyles.row, { marginBottom: 16 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>Height (cm) *</Text>
                  <TextInput
                    style={commonStyles.input}
                    value={profile.height ? profile.height.toString() : ''}
                    onChangeText={(text) => setProfile({ ...profile, height: parseInt(text) || 0 })}
                    placeholder="Height"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>Weight (kg) *</Text>
                  <TextInput
                    style={commonStyles.input}
                    value={profile.weight ? profile.weight.toString() : ''}
                    onChangeText={(text) => setProfile({ ...profile, weight: parseInt(text) || 0 })}
                    placeholder="Weight"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Sports Information</Text>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={[commonStyles.text, { marginBottom: 8 }]}>Primary Sport *</Text>
                <TouchableOpacity
                  style={commonStyles.input}
                  onPress={() => setShowSportPicker(!showSportPicker)}
                >
                  <Text style={[commonStyles.text, !profile.sport && { color: colors.textSecondary }]}>
                    {profile.sport || 'Select your sport'}
                  </Text>
                </TouchableOpacity>
                
                {showSportPicker && (
                  <View style={[commonStyles.card, { marginTop: 8 }]}>
                    {sports.map((sport) => (
                      <TouchableOpacity
                        key={sport}
                        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                        onPress={() => {
                          setProfile({ ...profile, sport });
                          setShowSportPicker(false);
                        }}
                      >
                        <Text style={commonStyles.text}>{sport}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={[commonStyles.text, { marginBottom: 8 }]}>Experience Level</Text>
                <View style={commonStyles.row}>
                  {levels.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        buttonStyles.outline,
                        { flex: 1, marginHorizontal: 2, paddingVertical: 8 },
                        profile.level === level && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setProfile({ ...profile, level: level as any })}
                    >
                      <Text style={[
                        buttonStyles.outlineText,
                        { fontSize: 14 },
                        profile.level === level && { color: colors.background }
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Button
              text="Save Profile"
              onPress={saveProfile}
              style={{ marginBottom: 20 }}
            />
          </View>
        ) : (
          <View>
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Physical Stats</Text>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={commonStyles.text}>Height:</Text>
                <Text style={commonStyles.text}>{profile.height} cm</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={commonStyles.text}>Weight:</Text>
                <Text style={commonStyles.text}>{profile.weight} kg</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={commonStyles.text}>Gender:</Text>
                <Text style={commonStyles.text}>{profile.gender}</Text>
              </View>
              <View style={commonStyles.row}>
                <Text style={commonStyles.text}>BMI:</Text>
                <Text style={[commonStyles.text, { color: getBMICategory().color }]}>
                  {getBMI()} ({getBMICategory().category})
                </Text>
              </View>
            </View>

            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitle}>Sports Information</Text>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={commonStyles.text}>Primary Sport:</Text>
                <Text style={commonStyles.text}>{profile.sport}</Text>
              </View>
              <View style={commonStyles.row}>
                <Text style={commonStyles.text}>Experience Level:</Text>
                <Text style={commonStyles.text}>
                  {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
