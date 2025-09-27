
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('Loading profile from AsyncStorage...');
      setIsLoading(true);
      const profileData = await AsyncStorage.getItem('userProfile');
      console.log('Profile data retrieved:', profileData);
      
      if (profileData) {
        const parsedProfile = JSON.parse(profileData);
        console.log('Parsed profile:', parsedProfile);
        setProfile(parsedProfile);
        setIsEditing(false);
      } else {
        console.log('No profile found, enabling edit mode');
        setIsEditing(true);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
      setIsEditing(true);
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfile = () => {
    console.log('Validating profile:', profile);
    
    if (!profile.name || profile.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Please enter a valid name (at least 2 characters)');
      return false;
    }

    if (!profile.age || profile.age < 10 || profile.age > 50) {
      Alert.alert('Validation Error', 'Age must be between 10 and 50 years');
      return false;
    }

    if (!profile.height || profile.height < 100 || profile.height > 250) {
      Alert.alert('Validation Error', 'Height must be between 100 and 250 cm');
      return false;
    }

    if (!profile.weight || profile.weight < 30 || profile.weight > 150) {
      Alert.alert('Validation Error', 'Weight must be between 30 and 150 kg');
      return false;
    }

    if (!profile.sport || profile.sport.trim().length === 0) {
      Alert.alert('Validation Error', 'Please select your primary sport');
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    try {
      console.log('Saving profile:', profile);
      setIsSaving(true);
      
      // Clean the profile data
      const cleanProfile = {
        ...profile,
        name: profile.name.trim(),
        sport: profile.sport.trim(),
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(cleanProfile));
      console.log('Profile saved successfully');
      
      // Verify the save by reading it back
      const savedProfile = await AsyncStorage.getItem('userProfile');
      console.log('Verification - saved profile:', savedProfile);
      
      setProfile(cleanProfile);
      setIsEditing(false);
      
      Alert.alert(
        'Success', 
        'Profile saved successfully! You can now take fitness assessment tests.',
        [{ text: 'OK', onPress: () => console.log('Profile save confirmed') }]
      );
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
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

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Icon name="person-outline" size={64} color={colors.textSecondary} />
        <Text style={commonStyles.title}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          onPress={() => setIsEditing(!isEditing)}
          disabled={isSaving}
        >
          <Icon 
            name={isEditing ? "close" : "create"} 
            size={24} 
            color={isSaving ? colors.textSecondary : colors.primary} 
          />
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
              {profile.name && (
                <View style={[commonStyles.badge, { marginTop: 8 }]}>
                  <Text style={commonStyles.badgeText}>Profile Complete</Text>
                </View>
              )}
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
                  editable={!isSaving}
                />
              </View>

              <View style={[commonStyles.row, { marginBottom: 16 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>Age *</Text>
                  <TextInput
                    style={commonStyles.input}
                    value={profile.age ? profile.age.toString() : ''}
                    onChangeText={(text) => {
                      const age = parseInt(text) || 0;
                      setProfile({ ...profile, age });
                    }}
                    placeholder="Age"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                    editable={!isSaving}
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
                      disabled={isSaving}
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
                      disabled={isSaving}
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
                    onChangeText={(text) => {
                      const height = parseInt(text) || 0;
                      setProfile({ ...profile, height });
                    }}
                    placeholder="Height"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                    editable={!isSaving}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>Weight (kg) *</Text>
                  <TextInput
                    style={commonStyles.input}
                    value={profile.weight ? profile.weight.toString() : ''}
                    onChangeText={(text) => {
                      const weight = parseInt(text) || 0;
                      setProfile({ ...profile, weight });
                    }}
                    placeholder="Weight"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                    editable={!isSaving}
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
                  onPress={() => !isSaving && setShowSportPicker(!showSportPicker)}
                  disabled={isSaving}
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
                        style={{ 
                          paddingVertical: 12, 
                          borderBottomWidth: 1, 
                          borderBottomColor: colors.border 
                        }}
                        onPress={() => {
                          setProfile({ ...profile, sport });
                          setShowSportPicker(false);
                        }}
                        disabled={isSaving}
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
                      disabled={isSaving}
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
              text={isSaving ? "Saving Profile..." : "Save Profile"}
              onPress={saveProfile}
              style={{ marginBottom: 20 }}
              disabled={isSaving}
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

            <View style={commonStyles.card}>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Icon name="checkmark-circle" size={24} color={colors.success} />
                <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                  Profile Complete - Ready for Assessment Tests
                </Text>
              </View>
              <Button
                text="Start Fitness Tests"
                onPress={() => router.push('/')}
                style={{ backgroundColor: colors.success }}
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
