import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { bandOf, type AxisScores } from "@/lib/financialInsights";

// 스코어 pill (?)을 탭했을 때 뜨는 쉬운말 설명 모달.
// 대시보드 안에서 짧게 개념 이해하고, 더 자세한 매핑은 /help로.
type Props = {
  visible: boolean;
  onClose: () => void;
  scores: AxisScores;
};

const BAND_INFO = [
  { min: 85, max: 100, label: "우수", color: "#00C853", bg: "#EDFFF5", meaning: "이 축은 지금 아주 건강합니다. 유지가 목표." },
  { min: 60, max: 84,  label: "정상", color: "#33A6FF", bg: "#EBF5FF", meaning: "평균 이상. 몇 개 지표만 손보면 우수 진입 가능." },
  { min: 40, max: 59,  label: "경고", color: "#FFB300", bg: "#FFF8E7", meaning: "이 축의 지표 절반 정도가 흔들리는 중. 원인 파악 필요." },
  { min: 0,  max: 39,  label: "위기", color: "#FF3B30", bg: "#FFF0EE", meaning: "여러 지표가 임계값을 넘음. 이번 주 안에 우선 대응 필요." },
];

export function ScoreExplainerModal({ visible, onClose, scores }: Props) {
  const goToHelp = () => {
    onClose();
    router.push("/help" as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrap}>
                  <Feather name="help-circle" size={16} color="#8B5CF6" />
                </View>
                <Text style={styles.title}>이 점수는 뭘 뜻하나요?</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Feather name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* 3문장 요약 */}
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>대시보드의 20개 경영지표</Text>를
                {" "}<Text style={styles.summaryBold}>3가지 축</Text>(수익성·유지·리스크)으로 나눠서,
                {" "}각 축이 지금 <Text style={styles.summaryBold}>얼마나 건강한지 0~100점</Text>으로 계산한 값이에요.
              </Text>
              <Text style={styles.summaryText}>
                각 지표를 <Text style={styles.summaryBold}>위기(0) · 경고(40) · 정상(80) · 최우수(100)</Text>로 채점한 뒤,
                축별로 평균을 내면 이 점수가 나옵니다.
              </Text>
              <Text style={styles.summaryTextSmall}>
                * 여러 레퍼런스에서 반복 등장하는 핵심 지표(예: LTV:CAC·재내원율·리콜 성공률·순이익률·예방 매출 비중)는 평균에서 <Text style={styles.summaryBold}>2배 반영</Text>됩니다.
              </Text>
            </View>

            {/* 지금 점수 */}
            <View style={styles.currentBlock}>
              <Text style={styles.currentLabel}>지금 원장님 병원 점수</Text>
              <View style={styles.currentRow}>
                {(
                  [
                    { key: "profitability", label: "수익성", score: scores.profitability },
                    { key: "retention",     label: "유지",   score: scores.retention },
                    { key: "risk",          label: "리스크", score: scores.risk },
                  ] as const
                ).map((axis) => {
                  const band = bandOf(axis.score);
                  const info = BAND_INFO.find((b) => band === "excellent" && b.label === "우수"
                    || band === "healthy" && b.label === "정상"
                    || band === "risk" && b.label === "경고"
                    || band === "critical" && b.label === "위기")!;
                  return (
                    <View key={axis.key} style={[styles.currentCell, { backgroundColor: info.bg, borderColor: `${info.color}44` }]}>
                      <Text style={styles.currentAxis}>{axis.label}</Text>
                      <Text style={[styles.currentScore, { color: info.color }]}>{axis.score}</Text>
                      <Text style={[styles.currentBand, { color: info.color }]}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 4밴드 안내 */}
            <View style={styles.bandBlock}>
              <Text style={styles.bandLabel}>점수 밴드 안내</Text>
              {BAND_INFO.map((b) => (
                <View key={b.label} style={styles.bandRow}>
                  <View style={[styles.bandPill, { backgroundColor: b.bg, borderColor: `${b.color}44` }]}>
                    <Text style={[styles.bandRange, { color: b.color }]}>{b.min}~{b.max}</Text>
                    <Text style={[styles.bandBandLabel, { color: b.color }]}>{b.label}</Text>
                  </View>
                  <Text style={styles.bandMeaning}>{b.meaning}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.moreBtn} onPress={goToHelp} activeOpacity={0.85}>
              <Feather name="book-open" size={14} color="#FFFFFF" />
              <Text style={styles.moreBtnText}>도움말에서 자세히 보기</Text>
              <Feather name="chevron-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 21, 61, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
  },
  scroll: { padding: 18, gap: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, fontSize: 15, fontWeight: "800" as const, color: "#00153D" },

  summary: { gap: 8, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12 },
  summaryText: { fontSize: 13, color: "#334155", lineHeight: 20 },
  summaryTextSmall: { fontSize: 11, color: "#64748B", lineHeight: 16 },
  summaryBold: { fontWeight: "800" as const, color: "#00153D" },

  currentBlock: { gap: 8 },
  currentLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "700" as const, letterSpacing: 0.3 },
  currentRow: { flexDirection: "row", gap: 8 },
  currentCell: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 2,
  },
  currentAxis: { fontSize: 11, color: "#64748B", fontWeight: "700" as const },
  currentScore: { fontSize: 22, fontWeight: "800" as const },
  currentBand: { fontSize: 11, fontWeight: "700" as const },

  bandBlock: { gap: 8 },
  bandLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "700" as const, letterSpacing: 0.3 },
  bandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bandPill: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 70, alignItems: "center",
  },
  bandRange: { fontSize: 10, fontWeight: "700" as const },
  bandBandLabel: { fontSize: 12, fontWeight: "800" as const },
  bandMeaning: { flex: 1, fontSize: 11, color: "#475569", lineHeight: 16 },

  moreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#8B5CF6", borderRadius: 12, paddingVertical: 12, marginTop: 4,
  },
  moreBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" as const },

  closeBtn: { alignItems: "center", paddingVertical: 8 },
  closeBtnText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" as const },
});
