import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";

const EMR_OPTIONS = [
  { id: "dentweb", name: "덴트웹", desc: "Dentweb EMR", color: "#0066FF" },
  { id: "hanaro", name: "하나로", desc: "Hanaro Dental", color: "#33A6FF" },
  { id: "caps", name: "캡스", desc: "CAPS 근태관리", color: "#00B8A9" },
  { id: "other", name: "기타 EMR", desc: "직접 연동", color: "#64748B" },
];

export default function QuestEMR() {
  const insets = useSafeAreaInsets();
  const { completeQuest } = useAppContext();
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSelect = async (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConnect = async () => {
    if (selected.length === 0) return;
    setShowModal(true);
  };

  const handleSendSMS = async () => {
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  const handleComplete = async () => {
    setShowModal(false);
    await completeQuest("quest1");
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#EBF5FF", "#FFFFFF"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#00153D" />
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>QUEST 1</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Feather name="zap" size={40} color="#33A6FF" />
        <Text style={styles.title}>소프트웨어 깨우기</Text>
        <Text style={styles.subtitle}>사용 중인 EMR · 근태관리 소프트웨어를 선택해주세요.{"\n"}데스크 PC에 에이전트 설치 링크를 발송합니다.</Text>

        <View style={styles.emrGrid}>
          {EMR_OPTIONS.map((emr) => (
            <TouchableOpacity
              key={emr.id}
              style={[styles.emrCard, selected.includes(emr.id) && styles.emrCardSelected, selected.includes(emr.id) && { borderColor: emr.color }]}
              onPress={() => handleSelect(emr.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.emrDot, { backgroundColor: emr.color }]} />
              <Text style={[styles.emrName, selected.includes(emr.id) && { color: emr.color }]}>{emr.name}</Text>
              <Text style={styles.emrDesc}>{emr.desc}</Text>
              {selected.includes(emr.id) && <Feather name="check-circle" size={16} color={emr.color} style={styles.emrCheck} />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.connectBtn, selected.length === 0 && styles.btnDisabled]}
          onPress={handleConnect}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.connectBtnText}>에이전트 설치 SMS 발송</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {!done ? (
              <>
                <Feather name="smartphone" size={36} color="#33A6FF" />
                <Text style={styles.modalTitle}>SMS 발송 준비</Text>
                <Text style={styles.modalDesc}>
                  원장님의 핸드폰 번호로{"\n"}AGE+ 에이전트 설치 링크를 발송합니다.
                </Text>
                <View style={styles.smsPreview}>
                  <Text style={styles.smsLabel}>발송 예정 SMS</Text>
                  <Text style={styles.smsText}>
                    [AGE+Brain] 데스크 PC에서 클릭해주세요:{"\n"}
                    https://ageplus.ai/agent/install?clinic=...{"\n"}
                    (24시간 유효)
                  </Text>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendSMS} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>발송하기</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.successIcon}>
                  <Feather name="check" size={32} color="#00C853" />
                </View>
                <Text style={styles.modalTitle}>SMS 발송 완료!</Text>
                <Text style={styles.modalDesc}>데스크 PC에 설치 후 자동 연동됩니다.</Text>
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: "#00C853" }]} onPress={handleComplete} activeOpacity={0.85}>
                  <Text style={styles.sendBtnText}>퀘스트 완료</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 4 },
  badge: { backgroundColor: "#EBF5FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#33A6FF", fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, gap: 20, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800" as const, color: "#00153D", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 22 },
  emrGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", width: "100%" },
  emrCard: {
    width: "46%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E8EDF5",
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#00153D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emrCardSelected: { backgroundColor: "#F8FBFF" },
  emrDot: { width: 12, height: 12, borderRadius: 6 },
  emrName: { fontSize: 16, fontWeight: "700" as const, color: "#00153D" },
  emrDesc: { fontSize: 11, color: "#64748B" },
  emrCheck: { position: "absolute", top: 10, right: 10 },
  connectBtn: {
    backgroundColor: "#33A6FF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  btnDisabled: { backgroundColor: "#CBD5E1" },
  connectBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  modalOverlay: { flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, alignItems: "center", gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800" as const, color: "#00153D" },
  modalDesc: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 22 },
  smsPreview: { backgroundColor: "#F5F7FA", borderRadius: 12, padding: 14, width: "100%", gap: 4 },
  smsLabel: { fontSize: 10, color: "#33A6FF", fontWeight: "700" as const, letterSpacing: 1 },
  smsText: { fontSize: 13, color: "#64748B", lineHeight: 20 },
  sendBtn: { backgroundColor: "#33A6FF", borderRadius: 14, height: 52, width: "100%", alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  cancelBtn: { padding: 10 },
  cancelText: { color: "#64748B", fontSize: 14 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E8FFF0", alignItems: "center", justifyContent: "center" },
});
