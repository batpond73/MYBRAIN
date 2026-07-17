import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeFab } from "@/components/HomeFab";
import { useAppContext } from "@/context/AppContext";

function CustomSlider({ value, onValueChange }: { value: number; onValueChange: (v: number) => void }) {
  const barWidthRef = useRef(0);
  // Absolute pixel position (0 → barWidth), drives both fill and thumb
  const thumbAnim = useRef(new Animated.Value(0)).current;
  const currentRatio = useRef(value);

  // Sync animated value when prop changes externally
  useEffect(() => {
    if (barWidthRef.current > 0) {
      thumbAnim.setValue(value * barWidthRef.current);
    }
    currentRatio.current = value;
  }, [value]);

  const panResponder = useRef(
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
        thumbAnim.setValue(x);          // No setState → no re-render → buttery smooth
        currentRatio.current = x / barWidthRef.current;
      },
      onPanResponderRelease: () => {
        onValueChange(currentRatio.current); // Single setState only on release
        Haptics.selectionAsync();
      },
    })
  ).current;

  return (
    <View
      style={styles.sliderTrack}
      onLayout={(e) => {
        barWidthRef.current = e.nativeEvent.layout.width;
        thumbAnim.setValue(currentRatio.current * barWidthRef.current);
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.sliderBg} />
      <Animated.View style={[styles.sliderFill, { width: thumbAnim }]} />
      <Animated.View style={[styles.sliderThumb, { left: thumbAnim }]} />
    </View>
  );
}

const SLIDERS: {
  id: "speed" | "communication" | "chair";
  label: string;
  leftLabel: string;
  rightLabel: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { id: "speed", label: "진료 속도", leftLabel: "신속·효율 중심", rightLabel: "꼼꼼·안정 중심", icon: "zap" },
  { id: "communication", label: "환자 소통", leftLabel: "핵심 위주 간결", rightLabel: "정서 교감·긴 상담", icon: "message-circle" },
  { id: "chair", label: "체어 회전", leftLabel: "다수 체어 동시 가동", rightLabel: "소수 체어 집중 전담", icon: "rotate-cw" },
];

export default function QuestProfile() {
  const insets = useSafeAreaInsets();
  const { completeQuest, setDoctorProfile, doctorProfile } = useAppContext();
  const [speed, setSpeed] = useState(doctorProfile.speedSlider);
  const [communication, setCommunication] = useState(doctorProfile.communicationSlider);
  const [chair, setChair] = useState(doctorProfile.chairSlider);
  const [managementType, setManagementType] = useState<"A" | "B" | null>(doctorProfile.managementType);

  const handleComplete = async () => {
    setDoctorProfile({ speedSlider: speed, communicationSlider: communication, chairSlider: chair, managementType });
    await completeQuest("quest2");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const vals: Record<"speed" | "communication" | "chair", number> = { speed, communication, chair };
  const sets: Record<"speed" | "communication" | "chair", (v: number) => void> = { speed: setSpeed, communication: setCommunication, chair: setChair };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#EBF5FF", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/dashboard");
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color="#00153D" />
        </TouchableOpacity>
        <View style={styles.badge}><Text style={styles.badgeText}>QUEST 2</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Feather name="cpu" size={40} color="#33A6FF" />
        <Text style={styles.title}>원장님 동기화</Text>
        <Text style={styles.subtitle}>AI가 원장님의 경영 스타일을 학습합니다.</Text>

        <View style={styles.slidersBlock}>
          {SLIDERS.map((s) => (
            <View key={s.id} style={styles.sliderCard}>
              <View style={styles.sliderHeader}>
                <Feather name={s.icon} size={16} color="#33A6FF" />
                <Text style={styles.sliderLabel}>{s.label}</Text>
              </View>
              <CustomSlider value={vals[s.id]} onValueChange={sets[s.id]} />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderEndLabel, vals[s.id] < 0.35 && styles.sliderLabelActive]}>{s.leftLabel}</Text>
                <Text style={[styles.sliderEndLabel, styles.sliderEndRight, vals[s.id] > 0.65 && styles.sliderLabelActive]}>{s.rightLabel}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>경영 성향 유형 선택</Text>
        <View style={styles.typeCards}>
          {(["A", "B"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeCard, managementType === type && styles.typeCardSelected]}
              onPress={async () => { setManagementType(type); await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.85}
            >
              <Text style={styles.typeLabel}>{type} 타입</Text>
              <Text style={styles.typeName}>{type === "A" ? "공격적 확장" : "고정비 절감"}</Text>
              <Text style={styles.typeDesc}>{type === "A" ? "마케팅형 매출 방어" : "내실 리콜 중심"}</Text>
              {managementType === type && <Feather name="check-circle" size={18} color="#33A6FF" style={styles.typeCheck} />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.completeBtn, !managementType && styles.btnDisabled]}
          onPress={handleComplete}
          disabled={!managementType}
          activeOpacity={0.85}
        >
          <Text style={styles.completeBtnText}>동기화 완료</Text>
          <Feather name="check" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>

      <HomeFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 4 },
  badge: { backgroundColor: "#EBF5FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#33A6FF", fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 20, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800" as const, color: "#00153D", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 22 },
  slidersBlock: { width: "100%", gap: 16 },
  sliderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    gap: 12,
    shadowColor: "#00153D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sliderHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderLabel: { fontSize: 13, fontWeight: "600" as const, color: "#00153D" },
  sliderTrack: { height: 28, justifyContent: "center", position: "relative" },
  sliderBg: { position: "absolute", left: 0, right: 0, height: 6, backgroundColor: "#E8EDF5", borderRadius: 3 },
  sliderFill: { position: "absolute", left: 0, height: 6, backgroundColor: "#33A6FF", borderRadius: 3 },
  sliderThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#33A6FF", position: "absolute", top: 3, marginLeft: -11, borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#33A6FF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between" },
  sliderEndLabel: { fontSize: 11, color: "#94A3B8", maxWidth: "44%" },
  sliderEndRight: { textAlign: "right" },
  sliderLabelActive: { color: "#33A6FF", fontWeight: "600" as const },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: "#00153D", alignSelf: "flex-start" },
  typeCards: { flexDirection: "row", gap: 12, width: "100%" },
  typeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E8EDF5",
    gap: 4,
    shadowColor: "#00153D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardSelected: { borderColor: "#33A6FF", backgroundColor: "#F0F8FF" },
  typeLabel: { fontSize: 10, color: "#33A6FF", fontWeight: "700" as const, letterSpacing: 1 },
  typeName: { fontSize: 15, fontWeight: "700" as const, color: "#00153D" },
  typeDesc: { fontSize: 12, color: "#64748B" },
  typeCheck: { position: "absolute", top: 12, right: 12 },
  completeBtn: {
    backgroundColor: "#33A6FF",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: { backgroundColor: "#CBD5E1" },
  completeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
});
