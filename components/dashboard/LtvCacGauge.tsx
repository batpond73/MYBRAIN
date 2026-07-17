import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";

// LTV:CAC 반원 게이지. Unit Economics 기준 3~5x가 최적 구간.
// <2x 위기 · 2~3x 경고 · 3~5x 정상 · >5x 점검(광고 축소 시그널).
export function LtvCacGauge({
  current,
  ltv,
  cac,
  payback,
}: {
  current: number;
  ltv: number;
  cac: number;
  payback: number;
}) {
  // 게이지 스펙: 반원 (180도), 0~8x 범위, 3~5x 초록 구간
  const width = 220;
  const height = 130;
  const cx = width / 2;
  const cy = height - 10;
  const radius = 90;
  const MAX = 8;
  const clamped = Math.max(0, Math.min(MAX, current));

  const toAngle = (v: number) => 180 - (v / MAX) * 180;   // 0 = 180°(좌), MAX = 0°(우)
  const polar = (angleDeg: number, r = radius) => {
    const rad = (Math.PI * angleDeg) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };
  const arc = (startDeg: number, endDeg: number, r = radius) => {
    const s = polar(startDeg, r);
    const e = polar(endDeg, r);
    const largeArc = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
    // startDeg > endDeg (시계 방향) 이므로 sweep=0
    return `M ${s.x},${s.y} A ${r},${r} 0 ${largeArc} 0 ${e.x},${e.y}`;
  };

  // 밴드 (배경)
  const bg = arc(180, 0);
  // 3~5x 최적 구간 (초록)
  const optimalStart = toAngle(3);
  const optimalEnd = toAngle(5);
  const optimal = arc(optimalStart, optimalEnd);
  // 실제 값 (파랑)
  const valueArc = arc(180, toAngle(clamped));
  // 값 표시 색상
  const status =
    current < 2 ? "#FF3B30" :
    current < 3 ? "#FFB300" :
    current <= 5 ? "#00C853" : "#33A6FF";
  const statusLabel =
    current < 2 ? "위기" :
    current < 3 ? "경고" :
    current <= 5 ? "최적" : "점검";

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        <Path d={bg}      stroke="#E8EDF5" strokeWidth={12} fill="none" strokeLinecap="round" />
        <Path d={optimal} stroke="#00C85344" strokeWidth={12} fill="none" strokeLinecap="butt" />
        <Path d={valueArc} stroke={status} strokeWidth={12} fill="none" strokeLinecap="round" />
        <SvgText x={cx} y={cy - 30} fontSize={26} fontWeight="800" fill={status} textAnchor="middle">
          {current.toFixed(1)}x
        </SvgText>
        <SvgText x={cx} y={cy - 12} fontSize={10} fill="#94A3B8" textAnchor="middle">
          LTV : CAC · {statusLabel}
        </SvgText>
      </Svg>
      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>LTV</Text>
          <Text style={styles.metaVal}>{Math.round(ltv / 10000).toLocaleString()}만</Text>
        </View>
        <View style={styles.metaSep} />
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>CAC</Text>
          <Text style={styles.metaVal}>{Math.round(cac / 10000).toLocaleString()}만</Text>
        </View>
        <View style={styles.metaSep} />
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Payback</Text>
          <Text style={styles.metaVal}>{payback}일</Text>
        </View>
      </View>
      <Text style={styles.caption}>
        Unit Economics · 3~5x 최적 (a16z 2024)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 6 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  metaCell: { alignItems: "center", minWidth: 52 },
  metaLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600" as const },
  metaVal: { fontSize: 13, color: "#00153D", fontWeight: "700" as const, marginTop: 2 },
  metaSep: { width: 1, height: 26, backgroundColor: "#E8EDF5" },
  caption: { fontSize: 10, color: "#94A3B8", marginTop: 2 },
});
