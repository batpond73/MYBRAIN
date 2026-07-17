import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

/**
 * 환자용 NPS 설문 폼 예시.
 *
 * 원장님이 직접 응답해보며 폼을 확인하고, 제출 시 NPS 계산 로직
 * (Promoter/Passive/Detractor 분류법)과 활용 팁을 즉시 확인할 수
 * 있게 만든 인터랙티브 프리뷰. 이 화면 자체를 태블릿/카카오톡 폼으로
 * 옮겨 실제 환자에게 배포하는 템플릿으로 사용 가능.
 *
 * 표시는 "환자가 보는 화면"이지만 결과 카드는 "원장이 읽을 인사이트"
 * 방식으로 두 시점을 한 카드에 담았다.
 */
type SubItem = { key: string; label: string };
const SUB_ITEMS: SubItem[] = [
  { key: "booking",   label: "예약 · 접수의 편의성" },
  { key: "wait",      label: "대기 시간 만족도" },
  { key: "explain",   label: "진료 · 처방 설명의 이해도" },
  { key: "kindness",  label: "의료진 · 스태프 친절도" },
];

const SUB_MIN = 1;
const SUB_MAX = 5;

type Category = "promoter" | "passive" | "detractor";

function categoryOf(score: number): Category {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

const CATEGORY_LABEL: Record<Category, string> = {
  promoter:  "추천자 (Promoter)",
  passive:   "중립 (Passive)",
  detractor: "비판자 (Detractor)",
};

const CATEGORY_COLOR: Record<Category, string> = {
  promoter:  "#00C853",
  passive:   "#33A6FF",
  detractor: "#FF3B30",
};

const CATEGORY_BG: Record<Category, string> = {
  promoter:  "#EDFFF5",
  passive:   "#EBF5FF",
  detractor: "#FFF0EE",
};

const CATEGORY_EXPLAIN: Record<Category, string> = {
  promoter:
    "다시 오고 지인도 데려올 확률이 높은 환자입니다. 이 층이 병원 매출의 65% 이상을 만듭니다.",
  passive:
    "만족스럽지만 열정은 없는 환자. 경쟁 병원이 조금만 편해도 이탈합니다. NPS 계산에서는 0점 처리.",
  detractor:
    "부정 후기·이탈 위험이 큰 환자. 리뷰 별점을 깎고, 지인에게 부정 후기를 퍼트리는 층입니다. 원인 파악 필수.",
};

const CATEGORY_ACTION: Record<Category, string[]> = {
  promoter: [
    "① 24시간 안에 '추천해주셔서 감사합니다' 감사 문자",
    "② 리콜 시점에 우선 예약 슬롯 자동 배정",
    "③ 지인 소개 이벤트 대상자 목록에 추가",
  ],
  passive: [
    "① 세부 만족도 항목 중 3점 이하 항목 원인 확인",
    "② 다음 방문 시 원장 직접 한마디 (개인화된 응대)",
    "③ 3개월 안에 재설문으로 이동 여부 추적",
  ],
  detractor: [
    "① 원장이 직접 24시간 안에 사과·확인 전화",
    "② 세부 항목 중 최저 점수 3개 원인 즉시 개선 조치",
    "③ 부정 온라인 리뷰 예방 · 개별 응대 후 재방문 유도",
  ],
};

// ── NPS 계산법 설명 ─────────────────────────────
// NPS = %Promoter - %Detractor.  Passive는 계산에서 0점 처리.
// 예: 100명 중 Promoter 40 · Passive 40 · Detractor 20 → NPS = 40-20 = 20
//
// 국내 치과 벤치마크: NPS 40+ 우수 · 20~40 정상 · 0~20 개선 · 0 미만 위기
function npsRange(score: number): string {
  if (score >= 40) return "우수 (Promoter 층이 매출·소개를 이끄는 병원)";
  if (score >= 20) return "정상 (평균 이상, 유지 관리 단계)";
  if (score >= 0)  return "개선 (Detractor 원인 파악 필요)";
  return "위기 (부정 후기·이탈 방지 즉시 착수)";
}

export function NpsSurveyForm() {
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [subScores, setSubScores] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const pick = async (n: number) => {
    try { await Haptics.selectionAsync(); } catch {}
    setScore(n);
  };
  const pickSub = async (key: string, v: number) => {
    try { await Haptics.selectionAsync(); } catch {}
    setSubScores((prev) => ({ ...prev, [key]: v }));
  };

  const submit = async () => {
    if (score === null) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setSubmitted(true);
  };
  const reset = async () => {
    try { await Haptics.selectionAsync(); } catch {}
    setScore(null);
    setReason("");
    setSubScores({});
    setSubmitted(false);
  };

  const category = score !== null ? categoryOf(score) : null;
  const catColor = category ? CATEGORY_COLOR[category] : "#94A3B8";

  return (
    <View style={styles.wrap}>
      {/* 사용 안내 헤더 */}
      <View style={styles.previewHead}>
        <Feather name="clipboard" size={12} color="#33A6FF" />
        <Text style={styles.previewHeadText}>
          환자가 응답할 화면 예시 · 직접 눌러보실 수 있습니다
        </Text>
      </View>

      {/* ── 환자용 폼 (미리보기) ────────────────── */}
      <View style={styles.patientCard}>
        <Text style={styles.clinicName}>서울나눔치과의원</Text>
        <Text style={styles.formTitle}>진료 만족도 설문</Text>

        {/* Q1: 핵심 NPS 질문 (0-10) */}
        <View style={styles.qBlock}>
          <Text style={styles.qLabel}>
            <Text style={styles.qNum}>Q1. </Text>
            이 병원을 지인이나 가족에게 추천하시겠습니까?
          </Text>
          <Text style={styles.qHint}>0 (전혀 아니다) — 10 (매우 그렇다)</Text>
          <View style={styles.scoreRow}>
            {Array.from({ length: 11 }, (_, i) => i).map((n) => {
              const active = score === n;
              const activeColor = CATEGORY_COLOR[categoryOf(n)];
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => pick(n)}
                  activeOpacity={0.75}
                  style={[
                    styles.scoreBtn,
                    active && { borderColor: activeColor, backgroundColor: `${activeColor}18` },
                  ]}
                >
                  <Text style={[styles.scoreBtnText, active && { color: activeColor, fontWeight: "800" as const }]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <Text style={[styles.legend, { color: "#FF3B30" }]}>0-6 비판자</Text>
            <Text style={[styles.legend, { color: "#33A6FF" }]}>7-8 중립</Text>
            <Text style={[styles.legend, { color: "#00C853" }]}>9-10 추천자</Text>
          </View>
        </View>

        {/* Q2: 이유 (선택) */}
        <View style={styles.qBlock}>
          <Text style={styles.qLabel}>
            <Text style={styles.qNum}>Q2. </Text>
            점수를 그렇게 매기신 이유가 있으시다면? <Text style={styles.optional}>(선택)</Text>
          </Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="예: 진료 설명이 이해가 잘 되었어요"
            placeholderTextColor="#CBD5E1"
            multiline
            value={reason}
            onChangeText={setReason}
          />
        </View>

        {/* Q3~6: 세부 만족도 (5점) */}
        <View style={styles.qBlock}>
          <Text style={styles.qLabel}>
            <Text style={styles.qNum}>Q3. </Text>
            아래 항목을 5점 만점으로 평가해주세요. <Text style={styles.optional}>(선택)</Text>
          </Text>
          {SUB_ITEMS.map((it) => (
            <View key={it.key} style={styles.subRow}>
              <Text style={styles.subLabel}>{it.label}</Text>
              <View style={styles.subScoreRow}>
                {Array.from({ length: SUB_MAX }, (_, i) => i + SUB_MIN).map((v) => {
                  const active = subScores[it.key] === v;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => pickSub(it.key, v)}
                      activeOpacity={0.75}
                      style={[styles.subBtn, active && styles.subBtnActive]}
                    >
                      <Text style={[styles.subBtnText, active && styles.subBtnTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* 제출 */}
        <TouchableOpacity
          style={[styles.submitBtn, score === null && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={score === null}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {submitted ? "재제출" : "제출하기"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 제출 결과 · 원장 인사이트 ────────────── */}
      {submitted && score !== null && category && (
        <View style={styles.resultCard}>
          <View style={styles.resultHead}>
            <Feather name="user" size={14} color="#8B5CF6" />
            <Text style={styles.resultHeadText}>원장님 인사이트</Text>
          </View>

          <View style={[styles.catBadge, { backgroundColor: CATEGORY_BG[category], borderColor: `${catColor}44` }]}>
            <View style={styles.catBadgeRow}>
              <Text style={[styles.catBadgeScore, { color: catColor }]}>{score}점</Text>
              <Text style={[styles.catBadgeLabel, { color: catColor }]}>{CATEGORY_LABEL[category]}</Text>
            </View>
            <Text style={styles.catExplain}>{CATEGORY_EXPLAIN[category]}</Text>
          </View>

          <View style={styles.actionBlock}>
            <Text style={styles.actionBlockLabel}>이 환자에게 취할 액션</Text>
            {CATEGORY_ACTION[category].map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <View style={[styles.actionDot, { backgroundColor: catColor }]} />
                <Text style={styles.actionText}>{a}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calcBlock}>
            <Text style={styles.calcTitle}>NPS 계산법</Text>
            <Text style={styles.calcBody}>
              전체 응답자 중 <Text style={styles.calcAccent}>Promoter %</Text> - <Text style={styles.calcAccent}>Detractor %</Text> = NPS 점수 (Passive는 0점 처리){"\n\n"}
              예: 100명 중 Promoter 40 · Passive 40 · Detractor 20 → NPS = 40 - 20 = <Text style={styles.calcAccent}>20</Text>
            </Text>
            <Text style={styles.calcBenchTitle}>국내 치과 벤치마크</Text>
            <View style={styles.benchGrid}>
              <View style={styles.benchCell}><Text style={[styles.benchScore, { color: "#00C853" }]}>40+</Text><Text style={styles.benchLabel}>우수</Text></View>
              <View style={styles.benchCell}><Text style={[styles.benchScore, { color: "#33A6FF" }]}>20~40</Text><Text style={styles.benchLabel}>정상</Text></View>
              <View style={styles.benchCell}><Text style={[styles.benchScore, { color: "#FFB300" }]}>0~20</Text><Text style={styles.benchLabel}>개선</Text></View>
              <View style={styles.benchCell}><Text style={[styles.benchScore, { color: "#FF3B30" }]}>&lt;0</Text><Text style={styles.benchLabel}>위기</Text></View>
            </View>
            <Text style={styles.calcCurrent}>
              이 응답 하나만으로 판정 시: <Text style={{ color: catColor, fontWeight: "700" as const }}>{npsRange(category === "promoter" ? 100 : category === "passive" ? 20 : -50)}</Text>
            </Text>
          </View>

          <View style={styles.usageBlock}>
            <Text style={styles.usageTitle}>실제 병원 도입 팁</Text>
            <Text style={styles.usageBody}>
              1. 진료 완료 24시간 안에 카카오톡·SMS로 이 폼 링크 발송 (응답률 최대 시점){"\n"}
              2. 매주 최소 30명 응답 확보 → 통계적으로 유의미한 NPS 계산{"\n"}
              3. Detractor(0-6점) 응답은 원장에게 즉시 알림 → 24시간 대응
            </Text>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.85}>
            <Feather name="rotate-ccw" size={14} color="#64748B" />
            <Text style={styles.resetBtnText}>다시 체험하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },

  previewHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewHeadText: { fontSize: 10, color: "#64748B", fontWeight: "600" as const },

  patientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    padding: 14,
    gap: 14,
  },
  clinicName: { fontSize: 11, color: "#94A3B8", textAlign: "center" as const, fontWeight: "600" as const },
  formTitle: { fontSize: 15, fontWeight: "800" as const, color: "#00153D", textAlign: "center" as const, marginBottom: 4 },

  qBlock: { gap: 6 },
  qLabel: { fontSize: 12, color: "#00153D", lineHeight: 18 },
  qNum: { fontWeight: "700" as const, color: "#33A6FF" },
  qHint: { fontSize: 10, color: "#94A3B8" },
  optional: { fontSize: 10, color: "#94A3B8", fontWeight: "500" as const },

  scoreRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "space-between" },
  scoreBtn: {
    width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF",
  },
  scoreBtnText: { fontSize: 12, color: "#64748B", fontWeight: "600" as const },
  legendRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  legend: { fontSize: 9, fontWeight: "600" as const },

  reasonInput: {
    minHeight: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    fontSize: 12,
    color: "#00153D",
    textAlignVertical: "top" as const,
  },

  subRow: { gap: 4 },
  subLabel: { fontSize: 11, color: "#334155" },
  subScoreRow: { flexDirection: "row", gap: 6 },
  subBtn: {
    flex: 1, height: 30, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF",
  },
  subBtnActive: { borderColor: "#33A6FF", backgroundColor: "#EBF5FF" },
  subBtnText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" as const },
  subBtnTextActive: { color: "#33A6FF", fontWeight: "800" as const },

  submitBtn: {
    height: 44, borderRadius: 12, backgroundColor: "#33A6FF",
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  submitBtnDisabled: { backgroundColor: "#CBD5E1" },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },

  // ── 결과 카드 ─────────────────────────────
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  resultHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultHeadText: { fontSize: 12, color: "#8B5CF6", fontWeight: "800" as const },

  catBadge: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  catBadgeRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  catBadgeScore: { fontSize: 22, fontWeight: "800" as const },
  catBadgeLabel: { fontSize: 13, fontWeight: "700" as const },
  catExplain: { fontSize: 11, color: "#475569", lineHeight: 16 },

  actionBlock: { gap: 6 },
  actionBlockLabel: { fontSize: 11, color: "#64748B", fontWeight: "700" as const },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  actionDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  actionText: { flex: 1, fontSize: 12, color: "#334155", lineHeight: 18 },

  calcBlock: { gap: 6, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10 },
  calcTitle: { fontSize: 12, fontWeight: "700" as const, color: "#00153D" },
  calcBody: { fontSize: 11, color: "#334155", lineHeight: 17 },
  calcAccent: { color: "#33A6FF", fontWeight: "700" as const },
  calcBenchTitle: { fontSize: 11, fontWeight: "700" as const, color: "#64748B", marginTop: 4 },
  benchGrid: { flexDirection: "row", gap: 6 },
  benchCell: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, padding: 6, alignItems: "center",
    borderWidth: 1, borderColor: "#E8EDF5",
  },
  benchScore: { fontSize: 13, fontWeight: "800" as const },
  benchLabel: { fontSize: 9, color: "#64748B", fontWeight: "600" as const, marginTop: 1 },
  calcCurrent: { fontSize: 11, color: "#475569", marginTop: 4, textAlign: "center" as const },

  usageBlock: { gap: 4, backgroundColor: "#EDFFF5", borderRadius: 10, padding: 10 },
  usageTitle: { fontSize: 12, fontWeight: "700" as const, color: "#00C853" },
  usageBody: { fontSize: 11, color: "#166534", lineHeight: 17 },

  resetBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    height: 36, borderRadius: 10, backgroundColor: "#F1F5F9",
  },
  resetBtnText: { fontSize: 12, color: "#64748B", fontWeight: "700" as const },
});
