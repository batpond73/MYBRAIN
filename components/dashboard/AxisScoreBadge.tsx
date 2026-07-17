import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ScoreBand } from "@/lib/financialInsights";

// 3축 스코어 표시용 미니 배지. 종합 진단 헤더에서 3개 병렬 배치.
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

const BAND_LABEL: Record<ScoreBand, string> = {
  critical:  "위기",
  risk:      "경고",
  healthy:   "정상",
  excellent: "우수",
};

export function AxisScoreBadge({
  label,
  score,
  band,
  framework,
}: {
  label: string;
  score: number;
  band: ScoreBand;
  framework: string;
}) {
  const color = BAND_COLOR[band];
  const bg = BAND_BG[band];
  const bandLabel = BAND_LABEL[band];
  const barPct = Math.max(0, Math.min(100, score));

  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor: `${color}33` }]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.pillText, { color }]}>{bandLabel}</Text>
        </View>
      </View>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${barPct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.framework}>{framework}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: "700" as const, color: "#00153D" },
  pill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  pillText: { fontSize: 10, fontWeight: "800" as const },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginTop: 2 },
  score: { fontSize: 22, fontWeight: "800" as const },
  scoreMax: { fontSize: 11, color: "#94A3B8", fontWeight: "600" as const },
  barTrack: { height: 4, backgroundColor: "#FFFFFF", borderRadius: 2, overflow: "hidden", marginTop: 2 },
  barFill: { height: "100%", borderRadius: 2 },
  framework: { fontSize: 9, color: "#64748B", marginTop: 2 },
});
