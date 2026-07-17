import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AxisScoreBadge } from "./AxisScoreBadge";
import { bandOf, type AxisScores, type RootCause } from "@/lib/financialInsights";

// 재무 심층분석 패널 최상단 종합 진단 헤더.
// 20개 지표 통합분석 결과 = (1) 3축 스코어 (2) 원인 지표 (3) 통합 처방 진입점.
type Props = {
  scores: AxisScores;
  verdict: string;
  rootCause: RootCause | null;
  rootCauseName: string | null;         // KPI 한글명 (예: "리콜 성공률")
  rootCauseCurrent: string | null;      // 현 period 값 문자열 (예: "61%")
  rootCauseReason: string;
  onPressOverall?: () => void;
  onPressRootCause?: () => void;
};

export function OverallVerdictHeader({
  scores,
  verdict,
  rootCause,
  rootCauseName,
  rootCauseCurrent,
  rootCauseReason,
  onPressOverall,
  onPressRootCause,
}: Props) {
  return (
    <View style={styles.wrap}>
      {/* 헤더 라인 */}
      <View style={styles.titleRow}>
        <Feather name="crosshair" size={14} color="#8B5CF6" />
        <Text style={styles.title}>20개 지표 통합 진단</Text>
      </View>
      <Text style={styles.verdict}>{verdict}</Text>

      {/* 3축 스코어 배지 */}
      <View style={styles.axisRow}>
        <AxisScoreBadge label="수익성" score={scores.profitability} band={bandOf(scores.profitability)} framework="Unit Economics" />
        <AxisScoreBadge label="유지"   score={scores.retention}     band={bandOf(scores.retention)}     framework="NRR·VBC" />
        <AxisScoreBadge label="리스크" score={scores.risk}          band={bandOf(scores.risk)}          framework="Lean·재무" />
      </View>

      {/* 원인 지표 카드 */}
      {rootCause && rootCauseName && (
        <TouchableOpacity style={styles.rootCauseCard} onPress={onPressRootCause} activeOpacity={0.85}>
          <View style={styles.rootCauseHead}>
            <Text style={styles.rootCauseIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rootCauseLabel}>가장 먼저 손대야 할 지표</Text>
              <Text style={styles.rootCauseName}>
                {rootCauseName}
                {rootCauseCurrent && <Text style={styles.rootCauseValue}>  {rootCauseCurrent}</Text>}
              </Text>
            </View>
            <View style={styles.downstreamPill}>
              <Text style={styles.downstreamPillText}>연쇄 회복 {rootCause.downstreamCount}건</Text>
            </View>
          </View>
          <Text style={styles.rootCauseReason}>{rootCauseReason}</Text>
        </TouchableOpacity>
      )}

      {/* 통합 처방 진입 */}
      {onPressOverall && (
        <TouchableOpacity style={styles.overallBtn} onPress={onPressOverall} activeOpacity={0.85}>
          <Feather name="file-text" size={14} color="#FFFFFF" />
          <Text style={styles.overallBtnText}>통합 AI 처방 보기</Text>
          <Feather name="chevron-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    gap: 10,
    marginBottom: 8,
    shadowColor: "#00153D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13, fontWeight: "800" as const, color: "#00153D", letterSpacing: 0.3 },
  verdict: { fontSize: 12, color: "#475569", lineHeight: 18 },

  axisRow: { flexDirection: "row", gap: 8 },

  rootCauseCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0A0",
    padding: 10,
    gap: 6,
  },
  rootCauseHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  rootCauseIcon: { fontSize: 16 },
  rootCauseLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600" as const },
  rootCauseName: { fontSize: 14, fontWeight: "800" as const, color: "#00153D", marginTop: 1 },
  rootCauseValue: { fontSize: 12, color: "#FFB300", fontWeight: "700" as const },
  downstreamPill: { backgroundColor: "#FFB30022", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  downstreamPillText: { fontSize: 10, color: "#B87400", fontWeight: "800" as const },
  rootCauseReason: { fontSize: 11, color: "#475569", lineHeight: 16 },

  overallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 2,
  },
  overallBtnText: { fontSize: 13, fontWeight: "800" as const, color: "#FFFFFF" },
});
