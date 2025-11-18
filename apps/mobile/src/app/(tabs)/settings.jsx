import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import {
  Volume2,
  VolumeX,
  Vibrate,
  Shield,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Info,
} from "lucide-react-native";
import { useAppTheme } from "@/utils/theme";
import { settingsStorage, sessionStorage } from "@/services/storage";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, borderRadius, shadows, isDark } =
    useAppTheme();

  const [settings, setSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    units: "metric",
  });
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const loadSettings = async () => {
    try {
      const savedSettings = await settingsStorage.get();
      setSettings(savedSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await settingsStorage.update({ [key]: value });
    } catch (error) {
      console.error("Failed to update setting:", error);
      // Revert the change on error
      setSettings(settings);
      Alert.alert("Error", "Failed to save setting. Please try again.");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your workout history and reset settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await sessionStorage.clearAllSessions();
              await settingsStorage.reset();
              const resetSettings = await settingsStorage.get();
              setSettings(resetSettings);
              Alert.alert("Success", "All data has been cleared.");
            } catch (error) {
              console.error("Failed to clear data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ],
    );
  };

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    value,
    onToggle,
    type = "switch",
    onPress,
    showChevron = false,
    color,
  }) => (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
      }}
      onPress={onPress}
      disabled={type === "switch"}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.md,
            backgroundColor: `${color || colors.accent}20`,
            justifyContent: "center",
            alignItems: "center",
            marginRight: spacing.sm,
          }}
        >
          <Icon size={20} color={color || colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typography.callout,
              color: colors.primary,
              marginBottom: description ? 2 : 0,
            }}
          >
            {title}
          </Text>
          {description && (
            <Text
              style={{
                ...typography.caption,
                color: colors.secondary,
                lineHeight: 16,
              }}
            >
              {description}
            </Text>
          )}
        </View>

        {type === "switch" && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{
              false: colors.borderLight,
              true: colors.accent,
            }}
            thumbColor={value ? "#FFFFFF" : colors.placeholder}
            ios_backgroundColor={colors.borderLight}
          />
        )}

        {showChevron && <ChevronRight size={16} color={colors.tertiary} />}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text
      style={{
        ...typography.headline,
        color: colors.primary,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      {title}
    </Text>
  );

  const InfoCard = ({
    title,
    description,
    icon: Icon,
    color = colors.info,
  }) => (
    <View
      style={{
        backgroundColor: `${color}15`,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginTop: spacing.lg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <Icon
          size={20}
          color={color}
          style={{ marginRight: spacing.sm, marginTop: 2 }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typography.callout,
              color: color,
              marginBottom: spacing.xs,
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
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <Text
          style={{
            ...typography.largeTitle,
            color: colors.primary,
            marginBottom: spacing.xs,
          }}
        >
          Settings
        </Text>

        <Text
          style={{
            ...typography.body,
            color: colors.secondary,
          }}
        >
          Customize your FormCoach experience
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Feedback Settings */}
        <SectionHeader title="Feedback" />

        <SettingItem
          icon={settings.soundEnabled ? Volume2 : VolumeX}
          title="Sound Feedback"
          description="Play audio cues during workouts"
          value={settings.soundEnabled}
          onToggle={(value) => updateSetting("soundEnabled", value)}
          color={colors.accent}
        />

        <SettingItem
          icon={Vibrate}
          title="Haptic Feedback"
          description="Vibration feedback for rep counting and form corrections"
          value={settings.vibrationEnabled}
          onToggle={(value) => updateSetting("vibrationEnabled", value)}
          color={colors.success}
        />

        {/* Data & Privacy */}
        <SectionHeader title="Data & Privacy" />

        <SettingItem
          icon={Trash2}
          title="Clear All Data"
          description="Delete workout history and reset all settings"
          type="button"
          onPress={handleClearData}
          showChevron={true}
          color={colors.error}
        />

        {/* Privacy Information */}
        <InfoCard
          icon={Shield}
          title="Privacy First Design"
          description="All pose analysis happens on your device. No video data is ever uploaded or shared. Your workout history is stored locally and never leaves your device."
          color={colors.success}
        />

        <InfoCard
          icon={Info}
          title="About FormCoach"
          description="FormCoach uses on-device AI to provide real-time exercise form feedback. The app works completely offline and prioritizes your privacy by processing all data locally."
        />

        {/* Version Info */}
        <View
          style={{
            alignItems: "center",
            marginTop: spacing.xl,
            paddingTop: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              ...typography.caption,
              color: colors.tertiary,
              marginBottom: spacing.xs,
            }}
          >
            FormCoach Version 1.0.0
          </Text>
          <Text
            style={{
              ...typography.caption2,
              color: colors.placeholder,
              textAlign: "center",
            }}
          >
            Built with privacy in mind • Runs 100% offline
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
