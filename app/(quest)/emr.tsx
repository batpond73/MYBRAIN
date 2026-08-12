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

import { HomeFab } from "@/components/HomeFab";

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
    // 현 mock 구현: 실제 SMS 발송·데스크 PC 에이전트 설치·자동 연동 파이프라인이
    // 아직 붙어있지 않다. 이전엔 "발송 완료 · 자동 연동됩니다" 문구로 이미 된 것처럼
    // 표시했으나 원장님에게 허위 정보 · 근본 픽스로 (a) 로딩 시뮬레이션 짧게 유지 +
    // (b) 완료 화면 문구를 "요청 접수"로 변경 + (c) "관리자 확인 후 연동" 명시.
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => { setLoading(false); setDone(true); }, 1200);
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
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/dashboard");
          }}
          style={styles.backBtn}
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color="#00153D" />
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>QUEST 1</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Feather name="zap" size={40} color="#33A6FF" />
        <Text style={styles.title}>소프트웨어 알려주기</Text>
        <Text style={styles.subtitle}>사용 중인 EMR · 근태관리 소프트웨어를 모두 선택해주세요.{"\n"}연동 요청을 접수하고 관리자 확인 후 진행됩니다.</Text>

        {/* 다중 선택 안내 배지 · UX 오해 방지 */}
        <View style={styles.multiHint}>
          <Feather name="check-square" size={12} color="#33A6FF" />
          <Text style={styles.multiHintText}>여러 개 선택할 수 있어요 · 예) 덴트웹 + 캡스</Text>
        </View>

        <View style={styles.emrGrid}>
          {EMR_OPTIONS.map((emr) => {
            const isSelected = selected.includes(emr.id);
            return (
              <TouchableOpacity
                key={emr.id}
                style={[
                  styles.emrCard,
                  isSelected && styles.emrCardSelected,
                  isSelected && { borderColor: emr.color, backgroundColor: `${emr.color}0D` }, // 8% 채도 배경
                ]}
                onPress={() => handleSelect(emr.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.emrDot, { backgroundColor: emr.color }, isSelected && styles.emrDotSelected]} />
                <Text style={[styles.emrName, isSelected && { color: emr.color }]}>{emr.name}</Text>
                <Text style={styles.emrDesc}>{emr.desc}</Text>
                {isSelected && (
                  <View style={[styles.emrCheckBadge, { backgroundColor: emr.color }]}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 선택된 개수 · 어떤 항목이 선택됐는지 확인 */}
        {selected.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionCount}>선택됨 {selected.length}개</Text>
            <Text style={styles.selectionList}>
              {selected.map((id) => EMR_OPTIONS.find((e) => e.id === id)?.name).join(" · ")}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.connectBtn, selected.length === 0 && styles.btnDisabled]}
          onPress={handleConnect}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.connectBtnText}>
            {selected.length === 0 ? "연동 요청 접수" : `${selected.length}개 항목 연동 요청`}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {!done ? (
              <>
                <Feather name="smartphone" size={36} color="#33A6FF" />
                <Text style={styles.modalTitle}>연동 요청 준비</Text>
                <Text style={styles.modalDesc}>
                  선택하신 {selected.length}개 소프트웨어에 대해{"\n"}
                  연동 요청을 접수합니다.{"\n"}
                  실제 에이전트 설치·데이터 연동은 관리자 확인 후 진행됩니다.
                </Text>
                <View style={styles.smsPreview}>
                  <Text style={styles.smsLabel}>요청 접수 대상 · {selected.map((id) => EMR_OPTIONS.find((e) => e.id === id)?.name).join(" + ")}</Text>
                  <Text style={styles.smsText}>
                    관리자가 병원과 확인 후{"\n"}
                    데스크 PC 에이전트 설치 안내를 드립니다.{"\n"}
                    (베타 · 일반적으로 1~3영업일 소요)
                  </Text>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendSMS} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>연동 요청 접수</Text>}
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
                <Text style={styles.modalTitle}>요청 접수 완료</Text>
                <Text style={styles.modalDesc}>
                  선택하신 {selected.length}개 소프트웨어 연동 요청이 접수됐어요.{"\n"}
                  관리자 확인 후 데스크 PC 설치 안내를 드립니다.{"\n"}
                  {"\n"}
                  지금은 데모 데이터로 대시보드를 미리 둘러보실 수 있어요.
                </Text>
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: "#00C853" }]} onPress={handleComplete} activeOpacity={0.85}>
                  <Text style={styles.sendBtnText}>대시보드 미리보기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

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
  // 선택 시 dot 크기 살짝 키우고 링 효과 · 색점이 여전히 카드 정체성이라 유지
  emrDotSelected: { width: 14, height: 14, borderRadius: 7 },
  emrName: { fontSize: 16, fontWeight: "700" as const, color: "#00153D" },
  emrDesc: { fontSize: 11, color: "#64748B" },
  emrCheck: { position: "absolute", top: 10, right: 10 },
  // 선택 뱃지 · 우상단에 solid 원 + 화이트 체크 · 이전 line-only check-circle보다 뚜렷
  emrCheckBadge: {
    position: "absolute" as const,
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  // 다중 선택 안내 배지 · 카드 위에 위치 · UX 오해 방지
  multiHint: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "#EBF5FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  multiHintText: { fontSize: 12, color: "#33A6FF", fontWeight: "600" as const },
  // 선택된 항목 요약 · 카드 아래 · 어떤 걸 골랐는지 재확인 UX
  selectionSummary: {
    width: "100%" as const,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 12,
    gap: 4,
  },
  selectionCount: { fontSize: 11, color: "#33A6FF", fontWeight: "700" as const, letterSpacing: 0.5 },
  selectionList: { fontSize: 14, color: "#00153D", fontWeight: "600" as const },
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
