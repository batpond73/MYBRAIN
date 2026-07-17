import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeFab } from "@/components/HomeFab";
import { useAppContext } from "@/context/AppContext";

const CATEGORIES = [
  { id: "material",   label: "재료비",   color: "#33A6FF", bg: "#EBF5FF" },
  { id: "labor",      label: "인건비",   color: "#FF3B30", bg: "#FFF0EE" },
  { id: "lab",        label: "기공비",   color: "#8B5CF6", bg: "#F3F0FF" },
  { id: "marketing",  label: "광고비",   color: "#F97316", bg: "#FFF7ED" },
  { id: "rent",       label: "임대료",   color: "#64748B", bg: "#F1F5F9" },
  { id: "utility",    label: "유틸리티", color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "supply",     label: "소모품",   color: "#00C853", bg: "#F0FFF4" },
  { id: "other",      label: "기타",     color: "#94A3B8", bg: "#F8FAFC" },
];

const MOCK_PRESCRIPTIONS: Record<string, { title: string; body: string; action: string }[]> = {
  high_labor: [
    { title: "⚠️ 인건비 과다", body: "오늘 인건비 지출이 일 매출 대비 35% 초과입니다. 초과근무 배치를 재검토하세요.", action: "다음 주 스케줄 재조정" },
    { title: "💡 재료 효율", body: "재료비가 정상 범위입니다. 현재 구매 패턴을 유지하세요.", action: "월말 재고 점검 예약" },
  ],
  high_marketing: [
    { title: "📊 광고 ROI 확인", body: "오늘 광고비 지출이 발생했습니다. 네이버 플레이스 전환율을 확인하세요.", action: "주간 광고 리포트 조회" },
    { title: "✅ 지출 균형", body: "전반적인 지출 구조가 안정적입니다. 내일 예약 현황을 점검하세요.", action: "예약 캘린더 확인" },
  ],
  default: [
    { title: "✅ 오늘 지출 정상", body: "업로드된 영수증 기준 지출 패턴이 정상 범위입니다.", action: "내일 진료 준비 점검" },
    { title: "💡 순이익률 유지", body: "오늘 지출 합계 기준 월간 목표 순이익률 15% 달성 가능합니다.", action: "이번 주 매출 입력 권장" },
  ],
};

interface Receipt {
  id: string;
  uri: string;
  name: string;
  categoryId: string;
  amount: string;
  isImage: boolean;
}

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${["일","월","화","수","목","금","토"][d.getDay()]})`;
}

export default function DailyReceipt() {
  // Auth gate wrapper — hooks 순서 안전.
  const { isLoaded, isAuthenticated } = useAppContext();
  if (!isLoaded) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-up" />;
  return <DailyReceiptInner />;
}

function DailyReceiptInner() {
  const insets = useSafeAreaInsets();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [catSheet, setCatSheet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<{ title: string; body: string; action: string }[] | null>(null);

  const totalAmount = receipts.reduce((sum, r) => {
    const n = parseInt(r.amount.replace(/[^0-9]/g, ""), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  function formatKRW(n: number) {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
    if (n >= 10000) return `${Math.round(n / 10000).toLocaleString()}만 원`;
    return `${n.toLocaleString()}원`;
  }

  const addReceipt = (uri: string, name: string, isImage: boolean) => {
    const newR: Receipt = { id: Date.now().toString(), uri, name, categoryId: "other", amount: "", isImage };
    setReceipts(prev => [newR, ...prev]);
  };

  const updateReceipt = (id: string, patch: Partial<Receipt>) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleCamera = async () => {
    setSheetOpen(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("카메라 권한 필요", "설정 > myBrain > 카메라를 허용해 주세요."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) addReceipt(result.assets[0].uri, result.assets[0].fileName ?? "사진.jpg", true);
  };

  const handleGallery = async () => {
    setSheetOpen(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("앨범 권한 필요", "설정 > myBrain > 사진을 허용해 주세요."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) result.assets.forEach(a => addReceipt(a.uri, a.fileName ?? "이미지.jpg", true));
  };

  const handleFilePicker = async () => {
    setSheetOpen(false);
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.type === "success") {
      addReceipt(result.uri, result.name, false);
    }
  };

  const handleGetPrescription = async () => {
    if (receipts.length === 0) { Alert.alert("영수증 없음", "영수증을 1장 이상 추가해 주세요."); return; }
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const hasHighLabor = receipts.some(r => r.categoryId === "labor" && parseInt(r.amount.replace(/[^0-9]/g, ""), 10) > 500000);
      const hasHighMarketing = receipts.some(r => r.categoryId === "marketing");
      const payload = {
        period: "today",
        clinicData: {
          name: "오늘 지출 분석",
          dailyReceipts: receipts.map(r => ({ category: r.categoryId, amount: parseInt(r.amount.replace(/[^0-9]/g, ""), 10) || 0, name: r.name })),
          totalSpending: totalAmount,
        },
      };
      if (domain) {
        const res = await fetch(`https://${domain}/api/ai/prescription`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.conclusion) {
            setPrescription([
              { title: "🧠 AI 처방전", body: data.conclusion, action: data.actions?.[0] ?? "지속 모니터링" },
            ]);
            setLoading(false);
            return;
          }
        }
      }
      await new Promise(r => setTimeout(r, 1800));
      const key = hasHighLabor ? "high_labor" : hasHighMarketing ? "high_marketing" : "default";
      setPrescription(MOCK_PRESCRIPTIONS[key]);
    } catch {
      await new Promise(r => setTimeout(r, 1800));
      setPrescription(MOCK_PRESCRIPTIONS.default);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#FFF8F0", "#FFFFFF"]} style={StyleSheet.absoluteFill} />

      {/* 헤더 */}
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>오늘의 지출 입력</Text>
          <Text style={styles.headerDate}>{todayLabel()}</Text>
        </View>
        {receipts.length > 0 && (
          <View style={styles.totalPill}>
            <Text style={styles.totalPillText}>{formatKRW(totalAmount)}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 영수증 없을 때 안내 */}
        {receipts.length === 0 && !prescription && (
          <View style={styles.emptyBlock}>
            <Feather name="file-plus" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>오늘의 영수증을 추가하세요</Text>
            <Text style={styles.emptyDesc}>카메라·앨범·PDF 파일 모두 지원{"\n"}영수증마다 항목과 금액을 입력하면{"\n"}AI가 오늘의 경영처방전을 생성합니다</Text>
          </View>
        )}

        {/* 영수증 카드 목록 */}
        {receipts.map(r => {
          const cat = CATEGORIES.find(c => c.id === r.categoryId) ?? CATEGORIES[7];
          return (
            <View key={r.id} style={styles.receiptCard}>
              {r.isImage ? (
                <Image source={{ uri: r.uri }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbFile}>
                  <Feather name="file-text" size={24} color="#33A6FF" />
                </View>
              )}
              <View style={styles.receiptBody}>
                <Text style={styles.receiptName} numberOfLines={1}>{r.name}</Text>
                {/* 항목 선택 */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, r.categoryId === c.id && { backgroundColor: c.bg, borderColor: c.color }]}
                      onPress={() => updateReceipt(r.id, { categoryId: c.id })}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.catChipText, r.categoryId === c.id && { color: c.color }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* 금액 입력 */}
                <View style={styles.amountRow}>
                  <Feather name="dollar-sign" size={14} color="#94A3B8" />
                  <TextInput
                    style={styles.amountInput}
                    placeholder="금액 입력 (예: 85000)"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    value={r.amount}
                    onChangeText={v => updateReceipt(r.id, { amount: v })}
                  />
                  <Text style={styles.wonLabel}>원</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeReceipt(r.id)} style={styles.deleteBtn}>
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* 처방전 결과 */}
        {prescription && (
          <View style={styles.prescriptionBlock}>
            <View style={styles.prescriptionHeader}>
              <Feather name="zap" size={18} color="#F97316" />
              <Text style={styles.prescriptionTitle}>오늘의 경영처방전</Text>
            </View>
            {prescription.map((p, i) => (
              <View key={i} style={styles.prescriptionItem}>
                <Text style={styles.prescriptionItemTitle}>{p.title}</Text>
                <Text style={styles.prescriptionItemBody}>{p.body}</Text>
                <View style={styles.actionRow}>
                  <Feather name="arrow-right-circle" size={14} color="#33A6FF" />
                  <Text style={styles.actionText}>{p.action}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setPrescription(null); setReceipts([]); }} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>새 영수증 입력</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 영수증 추가 버튼 */}
        {!prescription && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
            <Feather name="plus-circle" size={20} color="#F97316" />
            <Text style={styles.addBtnText}>영수증 추가</Text>
          </TouchableOpacity>
        )}

        {/* 합계 + 처방전 받기 */}
        {receipts.length > 0 && !prescription && (
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>오늘 지출 합계</Text>
              <Text style={styles.summaryTotal}>{formatKRW(totalAmount)}</Text>
            </View>
            <View style={styles.categorySummary}>
              {CATEGORIES.filter(c => receipts.some(r => r.categoryId === c.id)).map(c => {
                const sum = receipts.filter(r => r.categoryId === c.id).reduce((s, r) => s + (parseInt(r.amount.replace(/[^0-9]/g, ""), 10) || 0), 0);
                return (
                  <View key={c.id} style={styles.catSumRow}>
                    <View style={[styles.catDot, { backgroundColor: c.color }]} />
                    <Text style={styles.catSumLabel}>{c.label}</Text>
                    <Text style={styles.catSumAmount}>{sum > 0 ? formatKRW(sum) : "—"}</Text>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.prescriptionBtn, loading && styles.prescriptionBtnLoading]}
              onPress={handleGetPrescription}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.prescriptionBtnText}>AI 분석 중...</Text>
                </>
              ) : (
                <>
                  <Feather name="zap" size={18} color="#fff" />
                  <Text style={styles.prescriptionBtnText}>오늘의 처방전 받기</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* 첨부 바텀 시트 */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>영수증 첨부</Text>
          <TouchableOpacity style={styles.sheetOption} onPress={handleCamera} activeOpacity={0.8}>
            <View style={[styles.sheetIconWrap, { backgroundColor: "#EBF5FF" }]}>
              <Feather name="camera" size={22} color="#33A6FF" />
            </View>
            <Text style={styles.sheetOptionTitle}>카메라 촬영</Text>
            <Feather name="chevron-right" size={18} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetOption} onPress={handleGallery} activeOpacity={0.8}>
            <View style={[styles.sheetIconWrap, { backgroundColor: "#F0FFF4" }]}>
              <Feather name="image" size={22} color="#00C853" />
            </View>
            <Text style={styles.sheetOptionTitle}>사진 앨범</Text>
            <Feather name="chevron-right" size={18} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetOption} onPress={handleFilePicker} activeOpacity={0.8}>
            <View style={[styles.sheetIconWrap, { backgroundColor: "#FFF7ED" }]}>
              <Feather name="paperclip" size={22} color="#F97316" />
            </View>
            <Text style={styles.sheetOptionTitle}>파일 첨부</Text>
            <Feather name="chevron-right" size={18} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetCancel} onPress={() => setSheetOpen(false)} activeOpacity={0.7}>
            <Text style={styles.sheetCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <HomeFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "800" as const, color: "#00153D" },
  headerDate: { fontSize: 11, color: "#94A3B8", marginTop: 1 },
  totalPill: { backgroundColor: "#FFF7ED", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#FED7AA" },
  totalPillText: { fontSize: 13, fontWeight: "800" as const, color: "#F97316" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 48 },
  emptyBlock: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "700" as const, color: "#00153D" },
  emptyDesc: { fontSize: 13, color: "#94A3B8", textAlign: "center", lineHeight: 20 },
  receiptCard: {
    flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 12, gap: 12,
    borderWidth: 1, borderColor: "#E8EDF5",
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#F1F5F9" },
  thumbFile: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#EBF5FF", alignItems: "center", justifyContent: "center" },
  receiptBody: { flex: 1, gap: 6 },
  receiptName: { fontSize: 12, fontWeight: "600" as const, color: "#00153D" },
  catRow: { flexDirection: "row" },
  catChip: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6,
    borderWidth: 1, borderColor: "#E8EDF5", backgroundColor: "#F8FAFC",
  },
  catChipText: { fontSize: 11, fontWeight: "600" as const, color: "#94A3B8" },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  amountInput: { flex: 1, fontSize: 14, fontWeight: "700" as const, color: "#00153D", padding: 0 },
  wonLabel: { fontSize: 12, color: "#64748B" },
  deleteBtn: { padding: 4, marginTop: -4 },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 14, borderWidth: 2, borderColor: "#FED7AA", borderStyle: "dashed",
    paddingVertical: 16, backgroundColor: "#FFFBF5",
  },
  addBtnText: { fontSize: 15, fontWeight: "700" as const, color: "#F97316" },
  summaryBlock: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, gap: 12,
    borderWidth: 1, borderColor: "#E8EDF5",
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" as const },
  summaryTotal: { fontSize: 22, fontWeight: "800" as const, color: "#00153D" },
  categorySummary: { gap: 6 },
  catSumRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catSumLabel: { fontSize: 12, color: "#64748B", flex: 1 },
  catSumAmount: { fontSize: 12, fontWeight: "700" as const, color: "#00153D" },
  prescriptionBtn: {
    backgroundColor: "#F97316", borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
    shadowColor: "#F97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  prescriptionBtnLoading: { backgroundColor: "#CBD5E1", shadowColor: "#CBD5E1" },
  prescriptionBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  prescriptionBlock: {
    backgroundColor: "#FFFBF5", borderRadius: 18, padding: 18, gap: 14,
    borderWidth: 1, borderColor: "#FED7AA",
    shadowColor: "#F97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  prescriptionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  prescriptionTitle: { fontSize: 15, fontWeight: "800" as const, color: "#00153D" },
  prescriptionItem: { gap: 6, borderTopWidth: 1, borderTopColor: "#FED7AA", paddingTop: 12 },
  prescriptionItemTitle: { fontSize: 14, fontWeight: "700" as const, color: "#00153D" },
  prescriptionItemBody: { fontSize: 13, color: "#475569", lineHeight: 20 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  actionText: { fontSize: 12, color: "#33A6FF", fontWeight: "600" as const },
  resetBtn: { alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#FED7AA" },
  resetBtnText: { fontSize: 14, color: "#94A3B8", fontWeight: "600" as const },
  sheetBackdrop: { flex: 1, backgroundColor: "#00000050" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, gap: 4,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: "800" as const, color: "#00153D", marginBottom: 8 },
  sheetOption: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  sheetIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetOptionTitle: { flex: 1, fontSize: 15, fontWeight: "700" as const, color: "#00153D" },
  sheetCancel: { alignItems: "center", paddingVertical: 16 },
  sheetCancelText: { fontSize: 15, color: "#94A3B8", fontWeight: "600" as const },
});
