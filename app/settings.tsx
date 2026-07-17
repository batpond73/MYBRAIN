import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, LayoutAnimation, PanResponder, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, UIManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";
import { KPI_BENCHMARKS } from "@/constants/mockData";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function InlineSlider({ value, onValueChange }: { value: number; onValueChange: (v: number) => void }) {
  const barWidthRef = useRef(0);
  const thumbAnim = useRef(new Animated.Value(0)).current;
  const currentRatio = useRef(value);

  useEffect(() => {
    if (barWidthRef.current > 0) thumbAnim.setValue(value * barWidthRef.current);
    currentRatio.current = value;
  }, [value]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (barWidthRef.current <= 0) return;
        const x = Math.max(0, Math.min(barWidthRef.current, e.nativeEvent.locationX));
        thumbAnim.setValue(x);
        currentRatio.current = x / barWidthRef.current;
      },
      onPanResponderMove: (e) => {
        if (barWidthRef.current <= 0) return;
        const x = Math.max(0, Math.min(barWidthRef.current, e.nativeEvent.locationX));
        thumbAnim.setValue(x);
        currentRatio.current = x / barWidthRef.current;
      },
      onPanResponderRelease: () => {
        onValueChange(currentRatio.current);
        Haptics.selectionAsync();
      },
    })
  ).current;

  return (
    <View
      style={sl.track}
      onLayout={(e) => {
        barWidthRef.current = e.nativeEvent.layout.width;
        thumbAnim.setValue(currentRatio.current * barWidthRef.current);
      }}
      {...pan.panHandlers}
    >
      <View style={sl.bg} />
      <Animated.View style={[sl.fill, { width: thumbAnim }]} />
      <Animated.View style={[sl.thumb, { left: thumbAnim }]} />
    </View>
  );
}

const SLIDER_DEFS = [
  { id: "speed" as const,         label: "진료 속도",   leftLabel: "신속·효율", rightLabel: "꼼꼼·안정", icon: "zap" as const },
  { id: "communication" as const, label: "환자 소통",   leftLabel: "핵심 간결", rightLabel: "정서 교감", icon: "message-circle" as const },
  { id: "chair" as const,         label: "체어 회전",   leftLabel: "다수 동시", rightLabel: "소수 집중", icon: "rotate-cw" as const },
];

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { clinicName, userId, questsCompleted, doctorProfile, setDoctorProfile, logout } = useAppContext();
  const [notify, setNotify] = useState(true);
  const [expandedKpiId, setExpandedKpiId] = useState<number | null>(null);

  const toggleKpi = async (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedKpiId((prev) => (prev === id ? null : id));
    await Haptics.selectionAsync();
  };

  const [speed,         setSpeed]         = useState(doctorProfile.speedSlider);
  const [communication, setCommunication] = useState(doctorProfile.communicationSlider);
  const [chair,         setChair]         = useState(doctorProfile.chairSlider);
  const [mgmtType,      setMgmtType]      = useState<"A" | "B" | null>(doctorProfile.managementType);

  useEffect(() => {
    setSpeed(doctorProfile.speedSlider);
    setCommunication(doctorProfile.communicationSlider);
    setChair(doctorProfile.chairSlider);
    setMgmtType(doctorProfile.managementType);
  }, [doctorProfile.speedSlider, doctorProfile.communicationSlider, doctorProfile.chairSlider, doctorProfile.managementType]);

  const sliderVals: Record<"speed" | "communication" | "chair", number> = { speed, communication, chair };
  const sliderSets: Record<"speed" | "communication" | "chair", (v: number) => void> = {
    speed: (v) => { setSpeed(v); setDoctorProfile({ speedSlider: v }); },
    communication: (v) => { setCommunication(v); setDoctorProfile({ communicationSlider: v }); },
    chair: (v) => { setChair(v); setDoctorProfile({ chairSlider: v }); },
  };

  const handleMgmtType = async (type: "A" | "B") => {
    const next = mgmtType === type ? null : type;
    setMgmtType(next);
    setDoctorProfile({ managementType: next });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/sign-up"); } },
    ]);
  };

  const quests = [
    {
      key: "quest1" as const,
      label: "소프트웨어 깨우기",
      desc: "EMR · CAPS 연동 및 12개 지표 수집",
      icon: "zap" as const,
      color: "#33A6FF",
      bg: "#EBF5FF",
      route: "/(quest)/emr",
    },
    {
      key: "quest2" as const,
      label: "원장님 동기화",
      desc: "진료 스타일 · AI 처방 개인화",
      icon: "cpu" as const,
      color: "#8B5CF6",
      bg: "#F3F0FF",
      route: "/(quest)/profile",
    },
    {
      key: "quest3" as const,
      label: "재무 서류 스캔",
      desc: "8종 서류 OCR · 20대 KPI 완성",
      icon: "file-text" as const,
      color: "#00C853",
      bg: "#E8FFF0",
      route: "/(quest)/scan",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#00153D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정 · 마이페이지</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 병원 프로필 카드 */}
        <View style={styles.profileCard}>
          <Image source={require("@/assets/images/logo.png")} style={styles.profileLogo} contentFit="contain" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileClinic}>{clinicName || "병원명 미설정"}</Text>
            <Text style={styles.profileEmail}>{userId || "아이디 미설정"}</Text>
            <View style={styles.profileBadge}>
              <Feather name="shield" size={11} color="#33A6FF" />
              <Text style={styles.profileBadgeText}>원장님 전용 AI 관제탑</Text>
            </View>
          </View>
        </View>

        {/* 관제탑 3단계 — 탭해서 바로 수정 */}
        <Text style={styles.sectionLabel}>관제탑 3단계 설정</Text>
        <View style={styles.card}>
          {quests.map((q, idx) => {
            const done = questsCompleted[q.key];
            return (
              <View key={q.key}>
                <TouchableOpacity
                  style={styles.questRow}
                  activeOpacity={0.75}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(q.route as any);
                  }}
                >
                  <View style={[styles.questIcon, { backgroundColor: q.bg }]}>
                    <Feather name={q.icon} size={20} color={q.color} />
                  </View>
                  <View style={styles.questBody}>
                    <Text style={styles.questLabel}>{q.label}</Text>
                    <Text style={styles.questDesc}>{q.desc}</Text>
                  </View>
                  <View style={styles.questRight}>
                    <View style={[styles.questStatus, { backgroundColor: done ? "#E8FFF0" : "#FFF8E7" }]}>
                      <Text style={[styles.questStatusText, { color: done ? "#00C853" : "#FFB300" }]}>
                        {done ? "완료 ✓" : "미완료"}
                      </Text>
                    </View>
                    <View style={styles.editChip}>
                      <Feather name="edit-2" size={11} color="#33A6FF" />
                      <Text style={styles.editChipText}>수정</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {idx < quests.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* 원장님 진료 스타일 — 인라인 편집 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>원장님 진료 스타일</Text>
          <View style={styles.autoSaveBadge}>
            <Feather name="save" size={10} color="#00C853" />
            <Text style={styles.autoSaveText}>자동 저장</Text>
          </View>
        </View>

        <View style={styles.card}>
          {SLIDER_DEFS.map((s, idx) => (
            <View key={s.id}>
              <View style={styles.sliderBlock}>
                <View style={styles.sliderHeaderRow}>
                  <Feather name={s.icon} size={14} color="#33A6FF" />
                  <Text style={styles.sliderName}>{s.label}</Text>
                  <Text style={styles.sliderPct}>{Math.round(sliderVals[s.id] * 100)}%</Text>
                </View>
                <InlineSlider value={sliderVals[s.id]} onValueChange={sliderSets[s.id]} />
                <View style={styles.sliderEndLabels}>
                  <Text style={[styles.sliderEndLabel, sliderVals[s.id] < 0.35 && styles.sliderEndActive]}>← {s.leftLabel}</Text>
                  <Text style={[styles.sliderEndLabel, styles.sliderEndRight, sliderVals[s.id] > 0.65 && styles.sliderEndActive]}>{s.rightLabel} →</Text>
                </View>
              </View>
              {idx < SLIDER_DEFS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}

          <View style={styles.divider} />

          {/* 경영 성향 타입 */}
          <View style={styles.sliderBlock}>
            <View style={styles.sliderHeaderRow}>
              <Feather name="trending-up" size={14} color="#8B5CF6" />
              <Text style={styles.sliderName}>경영 성향</Text>
              {mgmtType && (
                <View style={styles.mgmtSelectedBadge}>
                  <Text style={styles.mgmtSelectedText}>{mgmtType === "A" ? "공격적 확장" : "고정비 절감"}</Text>
                </View>
              )}
            </View>
            <View style={styles.typeRow}>
              {(["A", "B"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, mgmtType === type && styles.typeBtnSelected]}
                  onPress={() => handleMgmtType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnLabel, mgmtType === type && styles.typeBtnLabelSelected]}>
                    {type} 타입
                  </Text>
                  <Text style={[styles.typeBtnDesc, mgmtType === type && styles.typeBtnDescSelected]}>
                    {type === "A" ? "공격적 확장" : "고정비 절감"}
                  </Text>
                  {mgmtType === type && (
                    <View style={styles.typeCheck}><Feather name="check" size={12} color="#33A6FF" /></View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 경영 히스토리 */}
        <Text style={styles.sectionLabel}>경영 분석</Text>
        <TouchableOpacity
          style={[styles.card, styles.historyBtn]}
          activeOpacity={0.8}
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/history" as any); }}
        >
          <View style={styles.historyIconWrap}>
            <Feather name="bar-chart-2" size={22} color="#33A6FF" />
          </View>
          <View style={styles.historyBody}>
            <Text style={styles.historyTitle}>경영 히스토리</Text>
            <Text style={styles.historyDesc}>20개 KPI · 위기→액션→개선 6개월 타임라인</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#33A6FF" />
        </TouchableOpacity>

        {/* KPI 지표 안내 */}
        <Text style={styles.sectionLabel}>KPI 지표 안내</Text>
        <View style={styles.card}>
          {KPI_BENCHMARKS.all20.map((kpi, idx) => {
            const isOpen = expandedKpiId === kpi.id;
            const statusColor =
              kpi.status === "crisis" ? "#FF3B30" :
              kpi.status === "warning" ? "#FFB300" :
              kpi.status === "best" ? "#00C853" : "#33A6FF";
            const judgeLabel =
              kpi.judgeType === "ABS" ? "절대 기준" :
              kpi.judgeType === "DERIVED" ? "파생 지표" : "연차 대비";
            const judgeColor =
              kpi.judgeType === "ABS" ? "#FFB300" :
              kpi.judgeType === "DERIVED" ? "#8B5CF6" : "#33A6FF";
            const judgeBg =
              kpi.judgeType === "ABS" ? "#FFF8E7" :
              kpi.judgeType === "DERIVED" ? "#F3F0FF" : "#EBF5FF";
            const statusLabel =
              kpi.status === "crisis" ? "위기" :
              kpi.status === "warning" ? "경고" :
              kpi.status === "best" ? "최우수" : "정상";
            return (
              <View key={kpi.id}>
                <TouchableOpacity
                  style={styles.kpiRow}
                  activeOpacity={0.75}
                  onPress={() => toggleKpi(kpi.id)}
                >
                  <View style={styles.kpiIdWrap}>
                    <Text style={styles.kpiId}>{kpi.id}</Text>
                  </View>
                  <View style={styles.kpiMain}>
                    <Text style={styles.kpiName}>{kpi.name}</Text>
                    <View style={styles.kpiTagRow}>
                      <View style={[styles.kpiTag, { backgroundColor: judgeBg }]}>
                        <Text style={[styles.kpiTagText, { color: judgeColor }]}>{judgeLabel}</Text>
                      </View>
                      <View style={[styles.kpiTag, { backgroundColor: `${statusColor}18` }]}>
                        <View style={[styles.kpiDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.kpiTagText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.kpiCurrent}>{kpi.current}</Text>
                  <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={14} color="#CBD5E1" />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.kpiExpanded}>
                    <View style={styles.kpiCriteriaRow}>
                      <Feather name="target" size={12} color="#64748B" />
                      <Text style={styles.kpiCriteriaLabel}>기준</Text>
                      <Text style={styles.kpiCriteriaValue}>{kpi.benchmark}</Text>
                    </View>
                    <View style={styles.kpiCriteriaRow}>
                      <Feather name="book-open" size={12} color="#64748B" />
                      <Text style={styles.kpiCriteriaLabel}>판정</Text>
                      <Text style={styles.kpiMethodValue}>
                        {kpi.judgeType === "ABS"
                          ? "의원 규모·연차 무관 절대 임계값으로 판정"
                          : kpi.judgeType === "DERIVED"
                          ? "파생 지표 — 상류 원인 지표로 안내 우선"
                          : "연차·규모 대비 추세·최적 구간으로 판정"}
                      </Text>
                    </View>
                    {"upstreamKpiKeys" in kpi && Array.isArray((kpi as any).upstreamKpiKeys) && (
                      <View style={styles.kpiCriteriaRow}>
                        <Feather name="arrow-up-circle" size={12} color="#8B5CF6" />
                        <Text style={[styles.kpiCriteriaLabel, { color: "#8B5CF6" }]}>원인</Text>
                        <Text style={[styles.kpiMethodValue, { color: "#8B5CF6" }]}>
                          {((kpi as any).upstreamKpiKeys as string[]).join(" · ")} 지표를 먼저 개선
                        </Text>
                      </View>
                    )}
                    {"formula" in kpi && (kpi as any).formula && (
                      <View style={styles.kpiCriteriaRow}>
                        <Feather name="code" size={12} color="#64748B" />
                        <Text style={styles.kpiCriteriaLabel}>산식</Text>
                        <Text style={styles.kpiCriteriaValue}>{(kpi as any).formula}</Text>
                      </View>
                    )}
                  </View>
                )}
                {idx < KPI_BENCHMARKS.all20.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* 앱 설정 */}
        <Text style={styles.sectionLabel}>앱 설정</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Feather name="bell" size={18} color="#64748B" />
            <Text style={styles.settingLabel}>AI 알림 수신</Text>
            <Switch
              value={notify}
              onValueChange={setNotify}
              trackColor={{ false: "#E8EDF5", true: "#33A6FF" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.75}>
            <Feather name="help-circle" size={18} color="#64748B" />
            <Text style={styles.settingLabel}>도움말 · 사용 가이드</Text>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.75}>
            <Feather name="info" size={18} color="#64748B" />
            <Text style={styles.settingLabel}>앱 버전</Text>
            <Text style={styles.settingValue}>v1.0.0 MVP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={18} color="#FF3B30" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>myBrain AGE+ Brain · 병원장 전용 AI 관제탑</Text>
      </ScrollView>
    </View>
  );
}

const sl = StyleSheet.create({
  track: { height: 32, justifyContent: "center", position: "relative", marginVertical: 4 },
  bg:    { position: "absolute", left: 0, right: 0, height: 6, backgroundColor: "#E8EDF5", borderRadius: 3 },
  fill:  { position: "absolute", left: 0, height: 6, backgroundColor: "#33A6FF", borderRadius: 3 },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#33A6FF", position: "absolute", top: 4, marginLeft: -12, borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#33A6FF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4, elevation: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E8EDF5",
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" as const, color: "#00153D" },
  content: { padding: 16, gap: 8, paddingBottom: 48 },

  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginBottom: 8,
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  profileLogo: { width: 64, height: 64 },
  profileInfo: { flex: 1, gap: 4 },
  profileClinic: { fontSize: 18, fontWeight: "800" as const, color: "#00153D" },
  profileEmail: { fontSize: 13, color: "#64748B" },
  profileBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  profileBadgeText: { fontSize: 11, color: "#33A6FF", fontWeight: "600" as const },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
  sectionLabel: { fontSize: 12, fontWeight: "700" as const, color: "#94A3B8", letterSpacing: 0.8, marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
  autoSaveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E8FFF0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  autoSaveText: { fontSize: 10, fontWeight: "700" as const, color: "#00C853" },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16,
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 4,
  },

  questRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  questIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  questBody: { flex: 1, gap: 2 },
  questLabel: { fontSize: 15, fontWeight: "700" as const, color: "#00153D" },
  questDesc: { fontSize: 12, color: "#64748B" },
  questRight: { alignItems: "flex-end", gap: 4 },
  questStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  questStatusText: { fontSize: 11, fontWeight: "700" as const },
  editChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#EBF5FF", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  editChipText: { fontSize: 10, fontWeight: "700" as const, color: "#33A6FF" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 6 },

  sliderBlock: { gap: 6, paddingVertical: 4 },
  sliderHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sliderName: { flex: 1, fontSize: 13, fontWeight: "600" as const, color: "#00153D" },
  sliderPct: { fontSize: 13, fontWeight: "800" as const, color: "#33A6FF", minWidth: 36, textAlign: "right" as const },
  sliderEndLabels: { flexDirection: "row", justifyContent: "space-between" },
  sliderEndLabel: { fontSize: 10, color: "#CBD5E1" },
  sliderEndRight: { textAlign: "right" as const },
  sliderEndActive: { color: "#33A6FF", fontWeight: "700" as const },

  mgmtSelectedBadge: { backgroundColor: "#EBF5FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  mgmtSelectedText: { fontSize: 11, fontWeight: "700" as const, color: "#33A6FF" },

  typeRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  typeBtn: {
    flex: 1, borderRadius: 14, borderWidth: 2, borderColor: "#E8EDF5",
    backgroundColor: "#FAFBFC", padding: 12, gap: 2, alignItems: "center",
  },
  typeBtnSelected: { borderColor: "#33A6FF", backgroundColor: "#EBF5FF" },
  typeBtnLabel: { fontSize: 10, fontWeight: "700" as const, color: "#94A3B8", letterSpacing: 1 },
  typeBtnLabelSelected: { color: "#33A6FF" },
  typeBtnDesc: { fontSize: 13, fontWeight: "700" as const, color: "#CBD5E1" },
  typeBtnDescSelected: { color: "#00153D" },
  typeCheck: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#EBF5FF",
    alignItems: "center", justifyContent: "center",
  },

  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  settingLabel: { flex: 1, fontSize: 15, color: "#00153D", fontWeight: "500" as const },
  settingValue: { fontSize: 13, color: "#94A3B8" },

  historyBtn:      { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 4 },
  historyIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#EBF5FF", alignItems: "center", justifyContent: "center" },
  historyBody:     { flex: 1, gap: 3 },
  historyTitle:    { fontSize: 15, fontWeight: "700" as const, color: "#00153D" },
  historyDesc:     { fontSize: 12, color: "#64748B" },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FFF0EE", borderRadius: 16, paddingVertical: 16, marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "700" as const, color: "#FF3B30" },
  footer: { textAlign: "center", fontSize: 11, color: "#CBD5E1", marginTop: 12 },

  // ── KPI 지표 안내 ──────────────────────────────────────────────
  kpiRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9,
  },
  kpiIdWrap: {
    width: 24, height: 24, borderRadius: 8, backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  kpiId: { fontSize: 10, fontWeight: "800" as const, color: "#94A3B8" },
  kpiMain: { flex: 1, gap: 4 },
  kpiName: { fontSize: 13, fontWeight: "700" as const, color: "#00153D" },
  kpiTagRow: { flexDirection: "row", gap: 5 },
  kpiTag: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  kpiTagText: { fontSize: 10, fontWeight: "700" as const },
  kpiDot: { width: 5, height: 5, borderRadius: 3 },
  kpiCurrent: { fontSize: 12, fontWeight: "700" as const, color: "#64748B", maxWidth: 80, textAlign: "right" as const },
  kpiExpanded: {
    backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12,
    marginBottom: 8, gap: 8,
  },
  kpiCriteriaRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  kpiCriteriaLabel: { fontSize: 11, fontWeight: "700" as const, color: "#64748B", width: 26, marginTop: 1 },
  kpiCriteriaValue: { flex: 1, fontSize: 11, color: "#334155", lineHeight: 16 },
  kpiMethodValue: { flex: 1, fontSize: 11, color: "#475569", lineHeight: 16 },
});
