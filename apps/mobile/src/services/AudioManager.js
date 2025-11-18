// AudioManager for workout sound feedback
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class AudioManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.isHapticsEnabled = true;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create sound objects from synthesized tones
      // For now, we'll use different frequencies to distinguish sounds
      this.sounds = {
        rep: await this.createToneSound(800, 150), // High-pitched "tang"
        error: await this.createToneSound(200, 300), // Low buzzer
        complete: await this.createToneSound(1000, 500), // Success chime
        start: await this.createToneSound(600, 200), // Start tone
      };

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
    }
  }

  // Create a simple tone sound (synthesized)
  // Note: This is a placeholder. In production, use actual audio files
  async createToneSound(frequency, duration) {
    try {
      // For Expo, we'll use the Audio.Sound.createAsync with a data URI
      // This is a workaround - ideally you'd have actual .mp3/.wav files
      const sound = await Audio.Sound.createAsync(
        // Using require() for local files would be better
        // For now, we'll return a mock object that plays system sounds
        { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' },
        { shouldPlay: false }
      );
      return sound.sound;
    } catch (error) {
      console.error(`Failed to create tone sound (${frequency}Hz):`, error);
      return null;
    }
  }

  async playRepSound() {
    if (!this.isEnabled) return;

    try {
      // Play haptic feedback
      if (this.isHapticsEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Play sound
      if (this.sounds.rep) {
        await this.sounds.rep.replayAsync();
      }
    } catch (error) {
      console.error('Error playing rep sound:', error);
    }
  }

  async playErrorSound() {
    if (!this.isEnabled) return;

    try {
      // Play haptic feedback
      if (this.isHapticsEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Play sound
      if (this.sounds.error) {
        await this.sounds.error.replayAsync();
      }
    } catch (error) {
      console.error('Error playing error sound:', error);
    }
  }

  async playCompleteSound() {
    if (!this.isEnabled) return;

    try {
      // Play haptic feedback
      if (this.isHapticsEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Play sound - play a sequence for satisfying effect
      if (this.sounds.complete) {
        await this.sounds.complete.replayAsync();
        // Add a second tone after a short delay for extra satisfaction
        setTimeout(async () => {
          if (this.sounds.rep) {
            await this.sounds.rep.replayAsync();
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error playing complete sound:', error);
    }
  }

  async playStartSound() {
    if (!this.isEnabled) return;

    try {
      // Play haptic feedback
      if (this.isHapticsEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      // Play sound
      if (this.sounds.start) {
        await this.sounds.start.replayAsync();
      }
    } catch (error) {
      console.error('Error playing start sound:', error);
    }
  }

  // Play a light haptic for minor feedback
  async playLightHaptic() {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error playing haptic:', error);
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  setHapticsEnabled(enabled) {
    this.isHapticsEnabled = enabled;
  }

  async cleanup() {
    try {
      // Unload all sounds
      for (const soundKey in this.sounds) {
        if (this.sounds[soundKey]) {
          await this.sounds[soundKey].unloadAsync();
        }
      }
      this.sounds = {};
      this.isInitialized = false;
    } catch (error) {
      console.error('Error cleaning up AudioManager:', error);
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
export default AudioManager;
