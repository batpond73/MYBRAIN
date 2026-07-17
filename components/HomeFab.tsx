import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Floating shortcut to /dashboard, anchored bottom-right above the safe area.
 * Drop it as the last child of a screen's root <View>; absolute positioning
 * keeps it out of ScrollView content flow.
 *
 * Pass `variant="light"` on dark backgrounds; the default assumes light bg.
 */
export function HomeFab({ variant = "primary" }: { variant?: "primary" | "light" }) {
  const insets = useSafeAreaInsets();
  const isLight = variant === "light";

  const handlePress = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    router.replace("/dashboard");
  };

  return (
    <TouchableOpacity
      accessibilityLabel="대시보드로 이동"
      onPress={handlePress}
      activeOpacity={0.85}
      style={[
        styles.fab,
        { bottom: insets.bottom + 20 },
        isLight ? styles.fabLight : styles.fabPrimary,
      ]}
    >
      <Feather
        name="home"
        size={16}
        color={isLight ? "#33A6FF" : "#FFFFFF"}
      />
      <Text style={[styles.label, isLight ? styles.labelLight : styles.labelPrimary]}>
        대시보드
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#00153D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPrimary: {
    backgroundColor: "#33A6FF",
  },
  fabLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#33A6FF33",
  },
  label: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  labelPrimary: { color: "#FFFFFF" },
  labelLight: { color: "#33A6FF" },
});
