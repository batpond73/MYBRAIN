import React from "react";
import { StyleSheet, Text, View } from "react-native";

// 미수금 회수 파이프라인. 30일 이내/30~60일/60~90일/90일+ 4버킷.
// 각 버킷에 회수 확률(%)을 스택 형태로 보여줌. 90일+ 회수 확률이
// 급락하는 리스크를 시각적으로 강조.
export type Bucket = {
  label: "30일 이내" | "30~60일" | "60~90일" | "90일 초과";
  amount: number;
  collectableRate: number;
};

const BAND_COLOR = (rate: number): string => {
  if (rate >= 80) return "#00C853";
  if (rate >= 55) return "#33A6FF";
  if (rate >= 30) return "#FFB300";
  return "#FF3B30";
};

function formatKRW(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}만원`;
  return `${n.toLocaleString()}원`;
}

export function UncollectedFunnel({ total, buckets }: { total: number; buckets: Bucket[] }) {
  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);
  const expectedCollect = buckets.reduce(
    (acc, b) => acc + Math.round(b.amount * (b.collectableRate / 100)),
    0
  );
  const expectedLoss = total - expectedCollect;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.topLabel}>총 미수금</Text>
          <Text style={styles.topAmount}>{formatKRW(total)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.topLabel}>예상 회수</Text>
          <Text style={[styles.topAmount, { color: "#00C853" }]}>{formatKRW(expectedCollect)}</Text>
          <Text style={styles.lossHint}>손실 예측 {formatKRW(expectedLoss)}</Text>
        </View>
      </View>

      {buckets.map((b, i) => {
        const color = BAND_COLOR(b.collectableRate);
        const widthPct = (b.amount / maxAmount) * 100;
        return (
          <View key={i} style={styles.bucketRow}>
            <View style={styles.bucketLeft}>
              <Text style={styles.bucketLabel}>{b.label}</Text>
              <Text style={styles.bucketAmount}>{formatKRW(b.amount)}</Text>
            </View>
            <View style={styles.barRow}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: color }]} />
              </View>
              <View style={[styles.ratePill, { backgroundColor: `${color}22` }]}>
                <Text style={[styles.rateText, { color }]}>회수 {b.collectableRate}%</Text>
              </View>
            </View>
          </View>
        );
      })}

      <Text style={styles.footnote}>
        90일 초과분은 회수 확률 급락 · 대손 처리 검토 구간
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  topRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  topLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600" as const },
  topAmount: { fontSize: 18, fontWeight: "800" as const, color: "#00153D", marginTop: 2 },
  lossHint: { fontSize: 10, color: "#FF3B30", marginTop: 2, fontWeight: "600" as const },

  bucketRow: { gap: 4 },
  bucketLeft: { flexDirection: "row", justifyContent: "space-between" },
  bucketLabel: { fontSize: 12, fontWeight: "600" as const, color: "#00153D" },
  bucketAmount: { fontSize: 12, fontWeight: "700" as const, color: "#334155" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barTrack: { flex: 1, height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  ratePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 62, alignItems: "center" },
  rateText: { fontSize: 10, fontWeight: "800" as const },

  footnote: { fontSize: 10, color: "#94A3B8", marginTop: 4, textAlign: "center" as const },
});
