import { useColorScheme } from "react-native";

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    colors: {
      // Background colors
      background: isDark ? "#0A0A0B" : "#F8F9FA",
      surface: isDark ? "#1C1C1E" : "#FFFFFF",
      surfaceVariant: isDark ? "#2C2C2E" : "#F2F2F7",
      surfaceSecondary: isDark ? "#1A1A1C" : "#F6F6F6",

      // Text colors
      primary: isDark ? "#FFFFFF" : "#1D1D1F",
      secondary: isDark ? "#A1A1A6" : "#6D6D70",
      tertiary: isDark ? "#8E8E93" : "#48484A",
      placeholder: isDark ? "#636366" : "#C7C7CC",
      disabled: isDark ? "#48484A" : "#8E8E93",

      // Border colors
      border: isDark ? "#38383A" : "#C6C6C8",
      borderLight: isDark ? "#2C2C2E" : "#E5E5EA",

      // Status colors for form feedback
      success: isDark ? "#30D158" : "#28CD41",
      successBg: isDark ? "#1E3A1E" : "#E8F7EA",
      warning: isDark ? "#FF9F0A" : "#FF8C00",
      warningBg: isDark ? "#3D2E1A" : "#FFF3E0",
      error: isDark ? "#FF453A" : "#FF3B30",
      errorBg: isDark ? "#3A1E1E" : "#FFEBEA",
      info: isDark ? "#64D2FF" : "#007AFF",
      infoBg: isDark ? "#1A2D3A" : "#E3F2FD",

      // Exercise category colors
      strength: isDark ? "#FF6B6B" : "#FF5252",
      strengthBg: isDark ? "#2D1A1A" : "#FFEBEE",
      cardio: isDark ? "#4ECDC4" : "#00BCD4",
      cardioBg: isDark ? "#1A2D2C" : "#E0F2F1",
      flexibility: isDark ? "#A8E6CF" : "#8BC34A",
      flexibilityBg: isDark ? "#1E2D1A" : "#F1F8E9",

      // Form quality indicators
      formGood: isDark ? "#30D158" : "#28CD41",
      formWarning: isDark ? "#FF9F0A" : "#FF8C00",
      formPoor: isDark ? "#FF453A" : "#FF3B30",

      // UI element colors
      accent: isDark ? "#007AFF" : "#007AFF",
      accentSecondary: isDark ? "#5AC8FA" : "#007AFF",

      // Exercise-specific colors
      pushupAccent: isDark ? "#FF6B35" : "#FF6B35",
      squatAccent: isDark ? "#6B73FF" : "#6B73FF",
      plankAccent: isDark ? "#FFB800" : "#FFB800",
      lungeAccent: isDark ? "#00C896" : "#00C896",

      // Overlay colors for camera view
      overlayDark: "rgba(0, 0, 0, 0.4)",
      overlayLight: "rgba(255, 255, 255, 0.15)",
      skeletonGood: "rgba(48, 209, 88, 0.8)",
      skeletonWarning: "rgba(255, 159, 10, 0.8)",
      skeletonError: "rgba(255, 69, 58, 0.8)",
    },

    // Common spacing values
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },

    // Typography scale
    typography: {
      largeTitle: {
        fontSize: 34,
        fontFamily: "Montserrat_600SemiBold",
        lineHeight: 41,
      },
      title1: {
        fontSize: 28,
        fontFamily: "Montserrat_600SemiBold",
        lineHeight: 34,
      },
      title2: {
        fontSize: 22,
        fontFamily: "Montserrat_600SemiBold",
        lineHeight: 28,
      },
      title3: {
        fontSize: 20,
        fontFamily: "Montserrat_600SemiBold",
        lineHeight: 25,
      },
      headline: {
        fontSize: 18,
        fontFamily: "Montserrat_600SemiBold",
        lineHeight: 22,
      },
      body: {
        fontSize: 16,
        fontFamily: "Montserrat_500Medium",
        lineHeight: 22,
      },
      callout: {
        fontSize: 14,
        fontFamily: "Montserrat_500Medium",
        lineHeight: 20,
      },
      caption: {
        fontSize: 12,
        fontFamily: "Montserrat_500Medium",
        lineHeight: 16,
      },
      caption2: {
        fontSize: 11,
        fontFamily: "Montserrat_500Medium",
        lineHeight: 13,
      },
    },

    // Border radius values
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      round: 1000, // For circular elements
    },

    // Shadow styles
    shadows: {
      sm: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  };
};
