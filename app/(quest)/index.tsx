import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";

interface QuestCardProps {
  index: number;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  completed: boolean;
  locked: boolean;
}

function QuestCard({ index, title, subtitle, icon, route, completed, locked }: QuestCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    if (locked) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <TouchableOpacity activeOpacity={locked ? 1 : 0.9} onPress={handlePress} disabled={locked}>
      <Animated.View
        style={[
          styles.card,
          completed && styles.cardCompleted,
          locked && styles.cardLocked,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.cardIconWrap, completed && styles.cardIconCompleted, locked && styles.cardIconLocked]}>
          {completed ? (
            <Feather name="check" size={26} color="#00C853" />
          ) : locked ? (
            <Feather name="lock" size={26} color="#94A3B8" />
          ) : (
            <Feather name={icon} size={26} color="#33A6FF" />
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardStep}>QUEST {index}</Text>
          <Text style={[styles.cardTitle, locked && styles.textMuted, completed && styles.textGreen]}>{title}</Text>
          <Text style={[styles.cardSubtitle, locked && styles.textMuted]}>{subtitle}</Text>
        </View>
        {!locked && !completed && <Feather name="chevron-right" size={22} color="#33A6FF" />}
        {completed && <Feather name="check-circle" size={22} color="#00C853" />}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function QuestHome() {
  const insets = useSafeAreaInsets();
  const { questsCompleted, clinicName, allQuestsCompleted, hasSeenIntro } = useAppContext();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasSeenIntro) router.replace("/intro");
  }, [hasSeenIntro]);

  const completedCount =
    (questsCompleted.quest1 ? 1 : 0) + (questsCompleted.quest2 ? 1 : 0) + (questsCompleted.quest3 ? 1 : 0);
  const progressPct = (completedCount / 3) * 100;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progressPct, duration: 800, useNativeDriver: false }).start();
  }, [progressPct]);

  useEffect(() => {
    if (allQuestsCompleted) {
      setTimeout(() => router.replace("/dashboard"), 1200);
    }
  }, [allQuestsCompleted]);

  const widthInterpolated = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#EBF5FF", "#FFFFFF"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="contain" />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>우리 병원 종합검진</Text>
          <Text style={styles.subGreeting} numberOfLines={2}>3단계를 완료하면 AI 관제탑이 활성화됩니다</Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>활성화 진행률</Text>
          <Text style={styles.progressPct}>{completedCount}/3 완료</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: widthInterpolated }]}>
            <LinearGradient
              colors={["#33A6FF", "#0066FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>

      <View style={styles.quests}>
        <QuestCard
          index={1}
          title="소프트웨어 깨우기"
          subtitle="12개 지표 자동 수집 (EMR · CAPS)"
          icon="zap"
          route="/(quest)/emr"
          completed={questsCompleted.quest1}
          locked={false}
        />
        <QuestCard
          index={2}
          title="원장님 동기화"
          subtitle="진료 스타일 · AI 처방 개인화"
          icon="cpu"
          route="/(quest)/profile"
          completed={questsCompleted.quest2}
          locked={!questsCompleted.quest1}
        />
        <QuestCard
          index={3}
          title="재무 서류 스캔"
          subtitle="8종 서류 OCR · 20대 지표 완성"
          icon="file-text"
          route="/(quest)/scan"
          completed={questsCompleted.quest3}
          locked={!questsCompleted.quest2}
        />
      </View>

      {allQuestsCompleted && (
        <View style={styles.completeBlock}>
          <Feather name="check-circle" size={32} color="#00C853" />
          <Text style={styles.completeText}>AI 관제탑 활성화 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 20 },
  logo: { width: 90, height: 90 },
  headerText: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: "700" as const, color: "#00153D" },
  subGreeting: { fontSize: 14, color: "#64748B", marginTop: 4 },
  progressBlock: { marginBottom: 28 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { color: "#64748B", fontSize: 15 },
  progressPct: { color: "#33A6FF", fontSize: 15, fontWeight: "700" as const },
  progressBar: { height: 10, backgroundColor: "#E8EDF5", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5, overflow: "hidden" },
  quests: { gap: 14 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#00153D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompleted: { borderColor: "#00C85333", backgroundColor: "#F0FFF4" },
  cardLocked: { opacity: 0.5 },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EBF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconCompleted: { backgroundColor: "#E8FFF0" },
  cardIconLocked: { backgroundColor: "#F1F5F9" },
  cardContent: { flex: 1 },
  cardStep: { fontSize: 12, color: "#33A6FF", fontWeight: "700" as const, letterSpacing: 1, marginBottom: 3 },
  cardTitle: { fontSize: 19, fontWeight: "700" as const, color: "#00153D" },
  cardSubtitle: { fontSize: 14, color: "#64748B", marginTop: 3 },
  textMuted: { color: "#94A3B8" },
  textGreen: { color: "#00C853" },
  completeBlock: { marginTop: 32, alignItems: "center", gap: 10 },
  completeText: { color: "#00C853", fontSize: 18, fontWeight: "700" as const },
});
