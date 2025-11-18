import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { router } from "expo-router";
import {
  Calendar,
  Clock,
  TrendingUp,
  Dumbbell,
  Activity,
  Timer,
  Zap,
  ChevronRight,
} from "lucide-react-native";
import { useAppTheme } from "@/utils/theme";
import { EXERCISE_TYPES } from "@/types/index";
import { sessionStorage, storageUtils } from "@/services/storage";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, borderRadius, shadows, isDark } =
    useAppTheme();

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

  useEffect(() => {
    loadSessions();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const loadSessions = async () => {
    try {
      const recentSessions = await sessionStorage.getRecentSessions(50);
      setSessions(recentSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const getExerciseIcon = (exerciseId) => {
    const exercise = EXERCISE_TYPES.find((e) => e.id === exerciseId);
    const iconMap = {
      Dumbbell: Dumbbell,
      Activity: Activity,
      Timer: Timer,
      Zap: Zap,
    };
    return iconMap[exercise?.icon] || Dumbbell;
  };

  const getExerciseColor = (exerciseId) => {
    const colorMap = {
      pushups: colors.pushupAccent,
      squats: colors.squatAccent,
      plank: colors.plankAccent,
      lunges: colors.lungeAccent,
    };
    return colorMap[exerciseId] || colors.accent;
  };

  const getExerciseName = (exerciseId) => {
    const exercise = EXERCISE_TYPES.find((e) => e.id === exerciseId);
    return exercise?.name || "Unknown Exercise";
  };

  const formatDate = (date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const sessionDay = new Date(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate(),
    );

    if (sessionDay.getTime() === today.getTime()) {
      return "Today";
    } else if (sessionDay.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return sessionDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          sessionDate.getFullYear() !== now.getFullYear()
            ? "numeric"
            : undefined,
      });
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const SessionCard = ({ session }) => {
    const Icon = getExerciseIcon(session.exerciseTypeId);
    const accentColor = getExerciseColor(session.exerciseTypeId);
    const exerciseName = getExerciseName(session.exerciseTypeId);
    const exercise = EXERCISE_TYPES.find(
      (e) => e.id === session.exerciseTypeId,
    );
    const isTimeBasedExercise = exercise?.supportedMetrics.includes("time");

    const handlePress = () => {
      // Navigate to session details (we'll create this later)
      router.push(`/(tabs)/summary/${session.id}`);
    };

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...shadows.sm,
        }}
        onPress={handlePress}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.md,
              backgroundColor: `${accentColor}20`,
              justifyContent: "center",
              alignItems: "center",
              marginRight: spacing.sm,
            }}
          >
            <Icon size={20} color={accentColor} />
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text
                style={{
                  ...typography.callout,
                  color: colors.primary,
                  marginBottom: 2,
                }}
              >
                {exerciseName}
              </Text>

              <Text
                style={{
                  ...typography.caption2,
                  color: colors.tertiary,
                }}
              >
                {formatTime(session.startTime)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              {isTimeBasedExercise ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                  }}
                >
                  {storageUtils.formatDuration(session.totalDuration)}
                </Text>
              ) : (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                  }}
                >
                  {session.totalReps} reps
                </Text>
              )}

              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.tertiary,
                  marginHorizontal: spacing.xs,
                }}
              />

              <Text
                style={{
                  ...typography.caption,
                  color: colors.secondary,
                }}
              >
                Form {storageUtils.formatScore(session.averageFormScore)}%
              </Text>
            </View>
          </View>

          <ChevronRight size={16} color={colors.tertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        paddingVertical: spacing.xxl,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surfaceVariant,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Calendar size={32} color={colors.placeholder} />
      </View>

      <Text
        style={{
          ...typography.title3,
          color: colors.primary,
          textAlign: "center",
          marginBottom: spacing.sm,
        }}
      >
        No Workout History
      </Text>

      <Text
        style={{
          ...typography.callout,
          color: colors.secondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Complete your first workout to see{"\n"}your progress here
      </Text>
    </View>
  );

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const dateKey = formatDate(session.startTime);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {});

  const sortedDateKeys = Object.keys(groupedSessions).sort((a, b) => {
    // Custom sort to handle "Today", "Yesterday" properly
    const order = { Today: 0, Yesterday: 1 };
    if (order[a] !== undefined && order[b] !== undefined) {
      return order[a] - order[b];
    }
    if (order[a] !== undefined) return -1;
    if (order[b] !== undefined) return 1;

    // For actual dates, sort by most recent first
    const dateA = groupedSessions[a][0].startTime;
    const dateB = groupedSessions[b][0].startTime;
    return new Date(dateB) - new Date(dateA);
  });

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
          History
        </Text>

        <Text
          style={{
            ...typography.body,
            color: colors.secondary,
          }}
        >
          Track your workout progress over time
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {sessions.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {sortedDateKeys.map((dateKey) => (
              <View key={dateKey} style={{ marginBottom: spacing.lg }}>
                <Text
                  style={{
                    ...typography.headline,
                    color: colors.primary,
                    marginBottom: spacing.sm,
                  }}
                >
                  {dateKey}
                </Text>

                {groupedSessions[dateKey].map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
