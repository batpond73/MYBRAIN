import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// HR × 재무 크로스 지표 2개를 한 카드에 표시.
// 좌: 인건비 대비 순이익 배수 (순이익 ÷ 인건비, ≥ 1.0이면 안정기)
// 우: 스태프 1인당 창출 순이익 (누적 만원, 규모 벤치마크 대비)
// 인건비 자체는 좌측 HR 관제에 있으므로 여기서는 "인건비가 낳는
// 순이익"만 다룬다.
type Props = {
  laborProfitRatio: { current: number; benchmark: number };
  perStaffProfit:   { current: number; benchmark: number };
  onPressLaborRatio?: () => void;
  onPressPerStaff?: () => void;
};

function statusColor(current: number, benchmark: number, higherIsBetter = true): string {
  const ratio = current / benchmark;
  if (higherIsBetter) {
    if (ratio >= 1)   return "#00C853";
    if (ratio >= 0.7) return "#33A6FF";
    if (ratio >= 0.5) return "#FFB300";
    return "#FF3B30";
  }
  if (ratio <= 1)   return "#00C853";
  if (ratio <= 1.3) return "#33A6FF";
  if (ratio <= 1.6) return "#FFB300";
  return "#FF3B30";
}

export function LaborCrossCard({ laborProfitRatio, perStaffProfit, onPressLaborRatio, onPressPerStaff }: Props) {
  const cRatio = statusColor(laborProfitRatio.current, laborProfitRatio.benchmark);
  const cStaff = statusColor(perStaffProfit.current, perStaffProfit.benchmark);

  const ratioBarPct = Math.min(100, (laborProfitRatio.current / laborProfitRatio.benchmark) * 100);
  const staffBarPct = Math.min(100, (perStaffProfit.current / perStaffProfit.benchmark) * 100);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.cell} activeOpacity={0.8} onPress={onPressLaborRatio}>
        <View style={styles.cellHead}>
          <Text style={styles.cellLabel}>인건비 대비 순이익</Text>
          <Feather name="chevron-right" size={12} color="#CBD5E1" />
        </View>
        <Text style={[styles.cellBig, { color: cRatio }]}>{laborProfitRatio.current.toFixed(2)}x</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${ratioBarPct}%`, backgroundColor: cRatio }]} />
        </View>
        <Text style={styles.cellSub}>
          목표 {laborProfitRatio.benchmark.toFixed(1)}x · 안정기 지표
        </Text>
      </TouchableOpacity>

      <View style={styles.sep} />

      <TouchableOpacity style={styles.cell} activeOpacity={0.8} onPress={onPressPerStaff}>
        <View style={styles.cellHead}>
          <Text style={styles.cellLabel}>인당 순이익</Text>
          <Feather name="chevron-right" size={12} color="#CBD5E1" />
        </View>
        <Text style={[styles.cellBig, { color: cStaff }]}>{perStaffProfit.current.toLocaleString()}만</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${staffBarPct}%`, backgroundColor: cStaff }]} />
        </View>
        <Text style={styles.cellSub}>
          목표 {perStaffProfit.benchmark}만 · 규모 벤치마크
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  cell: { flex: 1, gap: 4 },
  cellHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cellLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" as const },
  cellBig: { fontSize: 22, fontWeight: "800" as const, marginVertical: 2 },
  cellSub: { fontSize: 10, color: "#94A3B8", marginTop: 2 },
  barTrack: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  sep: { width: 1, backgroundColor: "#F1F5F9", marginHorizontal: 6 },
});
