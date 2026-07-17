import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { bandOf, type ScoreBand } from "@/lib/financialInsights";

// 재무 심층분석 3섹션 각각의 헤더.
// 왼쪽: 섹션명 + 방법론 · 오른쪽: 축 스코어 pill
const BAND_COLOR: Record<ScoreBand, string> = {
  critical:  "#FF3B30",
  risk:      "#FFB300",
  healthy:   "#33A6FF",
  excellent: "#00C853",
};

const BAND_BG: Record<ScoreBand, string> = {
  critical:  "#FFF0EE",
  risk:      "#FFF8E7",
  healthy:   "#EBF5FF",
  excellent: "#EDFFF5",
};

export function SectionHeader({
  title,
  framework,
  score,
  onPressExplain,
}: {
  title: string;
  framework: string;
  score: number;
  onPressExplain?: () => void;
}) {
  const band = bandOf(score);
  const color = BAND_COLOR[band];
  const bg = BAND_BG[band];
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.framework}>{framework}</Text>
      </View>
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: bg }]}
        activeOpacity={onPressExplain ? 0.7 : 1}
        onPress={onPressExplain}
        disabled={!onPressExplain}
        accessibilityLabel="스코어 설명 보기"
      >
        <Text style={[styles.pillScore, { color }]}>{score}</Text>
        <Text style={[styles.pillMax, { color }]}>/100</Text>
        {onPressExplain && <Feather name="help-circle" size={11} color={color} style={{ marginLeft: 3, opacity: 0.7 }} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  left: { flex: 1, gap: 1 },
  title: { fontSize: 14, fontWeight: "800" as const, color: "#00153D", letterSpacing: 0.3 },
  framework: { fontSize: 10, color: "#94A3B8" },
  pill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillScore: { fontSize: 14, fontWeight: "800" as const },
  pillMax: { fontSize: 9, fontWeight: "700" as const },
});
