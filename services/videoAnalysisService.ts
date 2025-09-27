
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';

export interface VideoAnalysisResult {
  measurements: any;
  score: number;
  analysis: string;
  confidence: number;
  detectedMovements: string[];
  formFeedback: string[];
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  sport: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

class VideoAnalysisService {
  private async getVideoMetadata(videoUri: string) {
    try {
      console.log('Getting video metadata for:', videoUri);
      const info = await FileSystem.getInfoAsync(videoUri);
      console.log('Video file info:', info);
      return info;
    } catch (error) {
      console.log('Error getting video metadata:', error);
      return null;
    }
  }

  private calculateBenchmarkScores(testId: string, profile: UserProfile) {
    // Age-based performance benchmarks
    const ageFactor = this.getAgeFactor(profile.age);
    const genderFactor = profile.gender === 'male' ? 1.1 : 1.0;
    const levelFactor = this.getLevelFactor(profile.level);
    
    console.log(`Calculating benchmarks for ${testId} - Age: ${profile.age}, Gender: ${profile.gender}, Level: ${profile.level}`);
    
    return {
      ageFactor,
      genderFactor,
      levelFactor,
      combinedFactor: ageFactor * genderFactor * levelFactor
    };
  }

  private getAgeFactor(age: number): number {
    if (age < 18) return 0.9;
    if (age <= 25) return 1.0;
    if (age <= 35) return 0.95;
    if (age <= 45) return 0.85;
    return 0.75;
  }

  private getLevelFactor(level: string): number {
    switch (level) {
      case 'beginner': return 0.8;
      case 'intermediate': return 1.0;
      case 'advanced': return 1.2;
      default: return 1.0;
    }
  }

  private simulateAIAnalysis(testId: string, videoUri: string, profile: UserProfile): Promise<VideoAnalysisResult> {
    return new Promise((resolve) => {
      console.log(`Starting AI analysis for ${testId} test`);
      
      // Simulate processing time
      setTimeout(() => {
        const benchmarks = this.calculateBenchmarkScores(testId, profile);
        const result = this.generateTestSpecificAnalysis(testId, benchmarks, profile);
        
        console.log('AI analysis completed:', result);
        resolve(result);
      }, 2000 + Math.random() * 3000); // 2-5 seconds processing time
    });
  }

  private generateTestSpecificAnalysis(testId: string, benchmarks: any, profile: UserProfile): VideoAnalysisResult {
    const { combinedFactor } = benchmarks;
    
    switch (testId) {
      case 'vertical-jump':
        return this.analyzeVerticalJump(combinedFactor, profile);
      case 'shuttle-run':
        return this.analyzeShuttleRun(combinedFactor, profile);
      case 'sit-ups':
        return this.analyzeSitUps(combinedFactor, profile);
      case 'endurance-run':
        return this.analyzeEnduranceRun(combinedFactor, profile);
      case 'height-weight':
        return this.analyzeHeightWeight(profile);
      default:
        return this.generateGenericAnalysis(combinedFactor);
    }
  }

  private analyzeVerticalJump(factor: number, profile: UserProfile): VideoAnalysisResult {
    const baseJump = 45 + (Math.random() * 25); // 45-70cm base
    const adjustedJump = Math.round(baseJump * factor);
    const maxPossible = profile.gender === 'male' ? 80 : 70;
    const score = Math.min(100, Math.round((adjustedJump / maxPossible) * 100));
    
    const detectedMovements = [
      'Knee bend detected',
      'Arm swing analyzed',
      'Jump height measured',
      'Landing form assessed'
    ];
    
    const formFeedback = [];
    if (score < 60) {
      formFeedback.push('Focus on deeper knee bend before jumping');
      formFeedback.push('Use arm swing for more momentum');
    }
    if (score >= 80) {
      formFeedback.push('Excellent explosive power');
      formFeedback.push('Great jumping technique');
    }
    
    return {
      measurements: { 
        jumpHeight: adjustedJump,
        attempts: 3,
        bestAttempt: adjustedJump,
        consistency: Math.round(85 + Math.random() * 15)
      },
      score,
      analysis: `Vertical jump height: ${adjustedJump}cm. ${this.getPerformanceLevel(score)} explosive power for your demographic. Your jumping technique shows ${score > 75 ? 'excellent' : score > 60 ? 'good' : 'developing'} form.`,
      confidence: Math.round(85 + Math.random() * 15),
      detectedMovements,
      formFeedback
    };
  }

  private analyzeShuttleRun(factor: number, profile: UserProfile): VideoAnalysisResult {
    const baseTime = 18 + (Math.random() * 8); // 18-26 seconds base
    const adjustedTime = baseTime / factor;
    const score = Math.min(100, Math.round((20 / adjustedTime) * 100));
    
    const detectedMovements = [
      'Direction changes counted',
      'Sprint speed analyzed',
      'Deceleration technique assessed',
      'Touch points verified'
    ];
    
    const formFeedback = [];
    if (score < 60) {
      formFeedback.push('Work on quicker direction changes');
      formFeedback.push('Maintain speed between markers');
    }
    if (score >= 80) {
      formFeedback.push('Excellent agility and speed');
      formFeedback.push('Great change of direction technique');
    }
    
    return {
      measurements: { 
        totalTime: Math.round(adjustedTime * 100) / 100,
        averageSplitTime: Math.round((adjustedTime / 10) * 100) / 100,
        topSpeed: Math.round((10 / (adjustedTime / 10)) * 100) / 100,
        consistency: Math.round(80 + Math.random() * 20)
      },
      score,
      analysis: `Shuttle run completed in ${adjustedTime.toFixed(2)} seconds. ${this.getPerformanceLevel(score)} agility and speed endurance. Your change of direction technique is ${score > 75 ? 'excellent' : score > 60 ? 'good' : 'developing'}.`,
      confidence: Math.round(88 + Math.random() * 12),
      detectedMovements,
      formFeedback
    };
  }

  private analyzeSitUps(factor: number, profile: UserProfile): VideoAnalysisResult {
    const baseReps = 35 + (Math.random() * 25); // 35-60 reps base
    const adjustedReps = Math.round(baseReps * factor);
    const score = Math.min(100, Math.round((adjustedReps / 60) * 100));
    
    const detectedMovements = [
      'Repetitions counted automatically',
      'Range of motion analyzed',
      'Form consistency tracked',
      'Pace variation detected'
    ];
    
    const formFeedback = [];
    if (score < 60) {
      formFeedback.push('Focus on full range of motion');
      formFeedback.push('Maintain consistent pace');
    }
    if (score >= 80) {
      formFeedback.push('Excellent core endurance');
      formFeedback.push('Great form consistency');
    }
    
    return {
      measurements: { 
        totalReps: adjustedReps,
        averagePace: Math.round((60 / adjustedReps) * 100) / 100,
        formScore: Math.round(75 + Math.random() * 25),
        fatigueFactor: Math.round(Math.random() * 30 + 70)
      },
      score,
      analysis: `Completed ${adjustedReps} sit-ups in 60 seconds. ${this.getPerformanceLevel(score)} core strength and endurance. Your form remained ${score > 75 ? 'excellent' : score > 60 ? 'good' : 'acceptable'} throughout the test.`,
      confidence: Math.round(90 + Math.random() * 10),
      detectedMovements,
      formFeedback
    };
  }

  private analyzeEnduranceRun(factor: number, profile: UserProfile): VideoAnalysisResult {
    const baseDistance = 2200 + (Math.random() * 1000); // 2200-3200m base
    const adjustedDistance = Math.round(baseDistance * factor);
    const score = Math.min(100, Math.round((adjustedDistance / 3500) * 100));
    
    const detectedMovements = [
      'Running pace analyzed',
      'Stride length measured',
      'Breathing pattern assessed',
      'Distance tracking verified'
    ];
    
    const formFeedback = [];
    if (score < 60) {
      formFeedback.push('Work on pacing strategy');
      formFeedback.push('Build cardiovascular endurance');
    }
    if (score >= 80) {
      formFeedback.push('Excellent cardiovascular fitness');
      formFeedback.push('Great pacing control');
    }
    
    return {
      measurements: { 
        distance: adjustedDistance,
        averagePace: Math.round((720 / adjustedDistance) * 1000 * 100) / 100,
        estimatedVO2Max: Math.round(35 + (score * 0.3)),
        heartRateZone: Math.round(Math.random() * 3 + 3)
      },
      score,
      analysis: `Covered ${adjustedDistance}m in 12 minutes. ${this.getPerformanceLevel(score)} cardiovascular endurance. Your pacing strategy was ${score > 75 ? 'excellent' : score > 60 ? 'good' : 'developing'}.`,
      confidence: Math.round(82 + Math.random() * 18),
      detectedMovements,
      formFeedback
    };
  }

  private analyzeHeightWeight(profile: UserProfile): VideoAnalysisResult {
    const bmi = profile.weight / ((profile.height / 100) ** 2);
    const idealBMI = profile.gender === 'male' ? 22.5 : 21.5;
    const bmiDiff = Math.abs(bmi - idealBMI);
    const score = Math.max(60, Math.round(100 - (bmiDiff * 10)));
    
    const detectedMovements = [
      'Posture analysis completed',
      'Height measurement verified',
      'Body composition estimated',
      'Proportions assessed'
    ];
    
    const formFeedback = [];
    if (bmi < 18.5) {
      formFeedback.push('Consider weight gain for optimal performance');
    } else if (bmi > 25) {
      formFeedback.push('Consider weight management for better performance');
    } else {
      formFeedback.push('Optimal body composition for athletic performance');
    }
    
    return {
      measurements: { 
        height: profile.height,
        weight: profile.weight,
        bmi: Math.round(bmi * 100) / 100,
        bodyFatEstimate: Math.round(12 + Math.random() * 8),
        muscleMassEstimate: Math.round(40 + Math.random() * 10)
      },
      score,
      analysis: `Height: ${profile.height}cm, Weight: ${profile.weight}kg, BMI: ${bmi.toFixed(1)}. ${this.getBMICategory(bmi)} body composition. Your measurements indicate ${score > 85 ? 'optimal' : score > 70 ? 'good' : 'acceptable'} athletic build.`,
      confidence: 95,
      detectedMovements,
      formFeedback
    };
  }

  private generateGenericAnalysis(factor: number): VideoAnalysisResult {
    const score = Math.round(60 + (Math.random() * 30 * factor));
    
    return {
      measurements: { value: Math.round(Math.random() * 100) },
      score,
      analysis: `Test completed successfully. ${this.getPerformanceLevel(score)} performance detected.`,
      confidence: Math.round(75 + Math.random() * 25),
      detectedMovements: ['Movement patterns analyzed'],
      formFeedback: ['Continue training for improvement']
    };
  }

  private getPerformanceLevel(score: number): string {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  }

  private getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  async analyzeVideo(videoUri: string, testId: string, profile: UserProfile): Promise<VideoAnalysisResult> {
    console.log(`Starting video analysis for ${testId} test`);
    console.log('Video URI:', videoUri);
    console.log('User profile:', profile);
    
    try {
      // Get video metadata
      const metadata = await this.getVideoMetadata(videoUri);
      
      if (!metadata || !metadata.exists) {
        throw new Error('Video file not found or inaccessible');
      }
      
      console.log('Video file size:', metadata.size, 'bytes');
      
      // Simulate AI processing
      const analysisResult = await this.simulateAIAnalysis(testId, videoUri, profile);
      
      console.log('Video analysis completed successfully');
      return analysisResult;
      
    } catch (error) {
      console.log('Error during video analysis:', error);
      throw new Error(`Video analysis failed: ${error.message}`);
    }
  }

  async saveVideoToLibrary(videoUri: string, testId: string): Promise<string> {
    try {
      console.log('Saving video to media library:', videoUri);
      
      // Create a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fitness_${testId}_${timestamp}.mp4`;
      
      // Copy to a permanent location using the correct property
      const permanentUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: videoUri,
        to: permanentUri
      });
      
      console.log('Video saved to permanent location:', permanentUri);
      return permanentUri;
      
    } catch (error) {
      console.log('Error saving video:', error);
      throw new Error(`Failed to save video: ${error.message}`);
    }
  }

  async uploadVideoToServer(videoUri: string, testResult: any): Promise<boolean> {
    try {
      console.log('Simulating video upload to SAI servers...');
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Video upload simulation completed');
      
      // In a real implementation, this would upload to actual servers
      // For now, we'll just return success
      return true;
      
    } catch (error) {
      console.log('Error uploading video:', error);
      return false;
    }
  }
}

export const videoAnalysisService = new VideoAnalysisService();
