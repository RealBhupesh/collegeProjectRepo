import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { settingsStorage } from "../services/storage";

export default function Index() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await settingsStorage.get();
      setSettings(savedSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Use default settings if loading fails
      setSettings({ onboardingCompleted: false });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Show loading state or splash screen
  }

  // Redirect to onboarding if not completed
  if (!settings.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  // Redirect to main app
  return <Redirect href="/(tabs)" />;
}
