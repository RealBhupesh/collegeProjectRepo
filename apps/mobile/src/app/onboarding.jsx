import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { Camera, Shield, CheckCircle, Settings } from "lucide-react-native";
import { useAppTheme } from "@/utils/theme";
import { settingsStorage } from "@/services/storage";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, borderRadius, shadows } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = async () => {
    if (permission?.granted) {
      await completeOnboarding();
      return;
    }

    setIsRequesting(true);
    try {
      const result = await requestPermission();
      if (result.granted) {
        await completeOnboarding();
      } else {
        showPermissionDeniedAlert();
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      Alert.alert(
        "Error",
        "Failed to request camera permission. Please try again.",
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await settingsStorage.update({
        onboardingCompleted: true,
        cameraPermissionGranted: true,
      });
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to save onboarding completion:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    }
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      "Camera Permission Required",
      "FormCoach needs camera access to analyze your exercise form. You can enable this in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  };

  const FeatureItem = ({ icon: Icon, title, description, color }) => (
    <View
      style={{
        flexDirection: "row",
        marginBottom: spacing.lg,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: borderRadius.md,
          backgroundColor: `${color}20`,
          justifyContent: "center",
          alignItems: "center",
          marginRight: spacing.md,
        }}
      >
        <Icon size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...typography.callout,
            color: colors.primary,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            lineHeight: 16,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + spacing.xl,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.accent,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.lg,
            }}
          >
            <Camera size={40} color="#FFFFFF" />
          </View>

          <Text
            style={{
              ...typography.title1,
              color: colors.primary,
              textAlign: "center",
              marginBottom: spacing.sm,
            }}
          >
            Welcome to FormCoach
          </Text>

          <Text
            style={{
              ...typography.body,
              color: colors.secondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Your AI-powered exercise form coach that works completely offline
          </Text>
        </View>

        {/* Features */}
        <View style={{ flex: 1, marginBottom: spacing.xl }}>
          <FeatureItem
            icon={Camera}
            title="Real-time Analysis"
            description="Get instant feedback on your exercise form using your device camera"
            color={colors.accent}
          />

          <FeatureItem
            icon={Shield}
            title="Privacy First"
            description="All analysis happens on your device. No video is ever uploaded"
            color={colors.success}
          />

          <FeatureItem
            icon={CheckCircle}
            title="Works Offline"
            description="No internet required after installation. Train anywhere"
            color={colors.strength}
          />
        </View>

        {/* Permission Notice */}
        <View
          style={{
            backgroundColor: colors.infoBg,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: colors.info,
              textAlign: "center",
              marginBottom: spacing.sm,
            }}
          >
            Camera Permission Required
          </Text>
          <Text
            style={{
              ...typography.caption2,
              color: colors.secondary,
              textAlign: "center",
              lineHeight: 14,
            }}
          >
            FormCoach needs camera access to analyze your exercise form in
            real-time
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.accent,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: "center",
            ...shadows.md,
          }}
          onPress={handleContinue}
          disabled={isRequesting}
        >
          <Text
            style={{
              ...typography.headline,
              color: "#FFFFFF",
            }}
          >
            {isRequesting
              ? "Requesting Permission..."
              : permission?.granted
                ? "Get Started"
                : "Enable Camera & Continue"}
          </Text>
        </TouchableOpacity>

        {/* Settings Link */}
        {permission?.granted === false && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: spacing.lg,
            }}
            onPress={() => Linking.openSettings()}
          >
            <Settings
              size={16}
              color={colors.secondary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                ...typography.callout,
                color: colors.secondary,
              }}
            >
              Open Device Settings
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
