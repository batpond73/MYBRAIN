import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

// 재내원율·리콜 성공률·예방 매출 비중 3게이지를 병렬 배치.
// 유지 경제학·Value-Based Care 축의 통합 뷰.
// 각 게이지 탭 → onPressKey(key)로 처방 modal 오픈.
type Row = {
  key: "returnRate" | "recallRate" | "preventiveRecall";
  label: string;
  value: number;
  benchmark: number;      // 이상값
  criticalBelow: number;  // 이 값 미만이면 위기
  suffix: string;
  hint: string;           // 아이콘 밑 짧은 설명
};

function DonutGauge({ value, color, size = 72 }: { value: number; color: string; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dashOffset = c * (1 - pct / 100);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size }}
    >
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E8EDF5" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <SvgText x={size / 2} y={size / 2 + 4} fontSize={14} fontWeight="800" fill={color} textAnchor="middle">
        {value}%
      </SvgText>
    </Svg>
  );
}

function colorFor(row: Row): string {
  if (row.value < row.criticalBelow) return "#FF3B30";
  if (row.value < row.benchmark) return "#FFB300";
  if (row.value >= row.benchmark * 1.1) return "#00C853";
  return "#33A6FF";
}

export function RetentionTrio({
  returnRate,
  recallRate,
  preventiveRatio,
  onPressKey,
}: {
  returnRate: number;
  recallRate: number;
  preventiveRatio: number;
  onPressKey?: (key: string) => void;
}) {
  const rows: Row[] = [
    { key: "returnRate",       label: "재내원율",     value: returnRate,     benchmark: 70, criticalBelow: 40, suffix: "%", hint: "치료 후 다시 오는 비율" },
    { key: "recallRate",       label: "리콜 성공률",  value: recallRate,     benchmark: 70, criticalBelow: 50, suffix: "%", hint: "안내 → 예약 성공률 · upstream" },
    { key: "preventiveRecall", label: "예방·리콜 매출 비중", value: preventiveRatio, benchmark: 18, criticalBelow: 12, suffix: "%", hint: "전체 매출 중 스케일링/검진 비중" },
  ];

  return (
    <View style={styles.wrap}>
      {rows.map((row, i) => {
        const color = colorFor(row);
        const content = (
          <View style={styles.cell}>
            <DonutGauge value={row.value} color={color} />
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.hint} numberOfLines={2}>{row.hint}</Text>
          </View>
        );
        return (
          <React.Fragment key={row.key}>
            {onPressKey ? (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onPressKey(row.key)} activeOpacity={0.75}>
                {content}
                <View style={styles.tapRow}>
                  <Feather name="chevron-right" size={12} color="#94A3B8" />
                  <Text style={styles.tapText}>처방</Text>
                </View>
              </TouchableOpacity>
            ) : (
              content
            )}
            {i < rows.length - 1 && <View style={styles.sep} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  cell: { flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 4 },
  label: { fontSize: 12, fontWeight: "700" as const, color: "#00153D", textAlign: "center" as const },
  hint:  { fontSize: 10, color: "#94A3B8", textAlign: "center" as const, lineHeight: 13 },
  sep:   { width: 1, backgroundColor: "#F1F5F9", marginHorizontal: 2, alignSelf: "stretch" },
  tapRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, marginTop: 4 },
  tapText: { fontSize: 10, color: "#94A3B8", fontWeight: "600" as const },
});
