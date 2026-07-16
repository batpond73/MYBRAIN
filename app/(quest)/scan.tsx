import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";

const SCAN_TYPES = [
  { id: "payroll",    label: "급여 대장",          icon: "file-text"   as const, desc: "세무사 발행 급여 명세서",                                        kpi: "① 인건비 비율 (TOP 1)" },
  { id: "insurance",  label: "4대보험 고지서",      icon: "shield"      as const, desc: "국민연금·건강·고용·산재",                                        kpi: "⑬ 이직률·인건비 구성" },
  { id: "material",   label: "재료비 세금계산서",   icon: "package"     as const, desc: "치과 재료·소모품 세금계산서",                                    kpi: "⑧ 재료비 비율" },
  { id: "labfee",     label: "기공소 고지서",       icon: "tool"        as const, desc: "기공소 납품·보철 비용",                                          kpi: "⑨ 기공료 비율" },
  { id: "rent",       label: "임대차 계약서",       icon: "home"        as const, desc: "원장 명의 임대 계약서",                                          kpi: "① 고정비(임대료)" },
  { id: "fixedcost",  label: "월 운영비 명세서",    icon: "layers"      as const, desc: "세무사 발행 — 감가상각·리스료·화재보험·유틸리티 항목별 정리본",  kpi: "① 총 고정비 비율" },
  { id: "marketing",  label: "광고비 집행 내역서",  icon: "trending-up" as const, desc: "네이버 광고·메타 광고관리자 → '청구서/월간 리포트' 다운로드",   kpi: "⑮ 마케팅 ROI" },
  { id: "tax",        label: "월 손익계산서",       icon: "dollar-sign" as const, desc: "세무사 발행 월별 손익계산서 (매출 총액·경비·순이익 포함)",       kpi: "② 월 순이익률" },
];

interface ParsedItem { field: string; value: string; confidence: number; }
interface KpiInsight { kpiName: string; value: string; benchmark: string; status: "normal" | "warning" | "critical"; impact: string; }

const KPI_INSIGHT: Record<string, KpiInsight> = {
  payroll:    { kpiName: "인건비 비율",    value: "35.4%",  benchmark: "기준 ≤ 25%",  status: "critical", impact: "업계 기준보다 10.4%p 초과 — 연간 약 4,900만 원 손실" },
  insurance:  { kpiName: "스태프 이직률", value: "12.5%",  benchmark: "기준 ≤ 15%",  status: "normal",   impact: "이직률 정상 범위 — 채용·교육 비용 안정적" },
  material:   { kpiName: "재료비 비율",   value: "2.7%",   benchmark: "업계 5–7%",   status: "normal",   impact: "재료비 효율 우수 — 대량구매 계약 효과" },
  labfee:     { kpiName: "기공료 비율",   value: "2.1%",   benchmark: "업계 8–10%",  status: "normal",   impact: "기공료 낮음 — 내부 제작 비율 확인 권장" },
  rent:       { kpiName: "임대료 비율",   value: "6.3%",   benchmark: "기준 ≤ 8%",   status: "normal",   impact: "임대료 정상 — 2027-08 만료 재협상 시 절감 기회" },
  fixedcost:  { kpiName: "총 고정비 비율",value: "11.7%",  benchmark: "기준 ≤ 55%",  status: "normal",   impact: "고정비 매우 안정적 — 감가상각·리스 구조 양호" },
  marketing:  { kpiName: "마케팅 ROI",   value: "5.4x",   benchmark: "기준 ≥ 3x",   status: "normal",   impact: "ROI 우수 — 네이버 플레이스가 핵심 채널" },
  tax:        { kpiName: "월 순이익률",   value: "17.0%",  benchmark: "목표 15–20%", status: "normal",   impact: "순이익률 목표 구간 유지 — 인건비 개선 시 22%+ 가능" },
};

const getMockParsed = (type: string | null): ParsedItem[] => {
  switch (type) {
    case "payroll": return [
      { field: "기준 급여 (세전)", value: "3,200,000원", confidence: 98 },
      { field: "4대보험 (고용주 부담)", value: "287,040원", confidence: 96 },
      { field: "퇴직충당금", value: "266,667원", confidence: 94 },
      { field: "실지출 인건비 (세전 환산)", value: "3,753,707원", confidence: 97 },
      { field: "스태프 수", value: "8명", confidence: 99 },
    ];
    case "insurance": return [
      { field: "총 피보험자 수 (당월)", value: "8명", confidence: 99 },
      { field: "신규 가입자 (입사)", value: "1명", confidence: 98 },
      { field: "상실자 (퇴사)", value: "0명", confidence: 98 },
      { field: "연간 누적 이직자 수", value: "1명 / 8명", confidence: 96 },
      { field: "스태프 이직률 (연환산)", value: "12.5%", confidence: 95 },
      { field: "4대보험 사업주 부담 합계", value: "1,125,000원", confidence: 99 },
    ];
    case "material": return [
      { field: "임플란트 fixture 소모품", value: "680,000원", confidence: 97 },
      { field: "마취제·소독제", value: "210,000원", confidence: 95 },
      { field: "교정 브라켓·와이어", value: "340,000원", confidence: 94 },
      { field: "기타 소모성 재료", value: "870,000원", confidence: 92 },
      { field: "월 재료비 합계", value: "2,100,000원", confidence: 98 },
    ];
    case "labfee": return [
      { field: "크라운·브릿지 (PFM)", value: "520,000원", confidence: 96 },
      { field: "지르코니아 보철", value: "780,000원", confidence: 97 },
      { field: "틀니 (의치)", value: "210,000원", confidence: 95 },
      { field: "기타 기공물", value: "140,000원", confidence: 93 },
      { field: "월 기공비 합계", value: "1,650,000원", confidence: 98 },
    ];
    case "rent": return [
      { field: "임대 면적", value: "165㎡ (50평)", confidence: 99 },
      { field: "월 임대료 (VAT 포함)", value: "4,950,000원", confidence: 99 },
      { field: "관리비", value: "480,000원", confidence: 97 },
      { field: "계약 만료일", value: "2027-08-31", confidence: 98 },
      { field: "월 고정비 (임대+관리)", value: "5,430,000원", confidence: 99 },
    ];
    case "fixedcost": return [
      { field: "감가상각비 (장비·인테리어)", value: "1,200,000원", confidence: 95 },
      { field: "의료기기 리스료", value: "980,000원", confidence: 97 },
      { field: "건물 화재·배상 보험료", value: "320,000원", confidence: 96 },
      { field: "전기·수도·가스 유틸리티", value: "680,000원", confidence: 94 },
      { field: "고정비 소계 (비임대)", value: "3,180,000원", confidence: 97 },
    ];
    case "marketing": return [
      { field: "네이버 플레이스 광고비", value: "800,000원", confidence: 98 },
      { field: "인스타그램·메타 광고비", value: "500,000원", confidence: 97 },
      { field: "블로그 포스팅 대행비", value: "300,000원", confidence: 96 },
      { field: "카카오 알림톡 발송비", value: "120,000원", confidence: 99 },
      { field: "월 마케팅 지출 합계", value: "1,720,000원", confidence: 98 },
      { field: "광고 유입 신환 수 (당월)", value: "31명", confidence: 91 },
      { field: "신환 1인당 평균 매출", value: "301,000원", confidence: 89 },
      { field: "마케팅 ROI", value: "5.4x", confidence: 90 },
    ];
    default: return [
      { field: "당월 총 매출 (신고 기준)", value: "78,000,000원", confidence: 99 },
      { field: "인건비 합계", value: "27,600,000원", confidence: 97 },
      { field: "재료비·기공비", value: "3,750,000원", confidence: 95 },
      { field: "임대료+관리비", value: "5,430,000원", confidence: 99 },
      { field: "감가상각·리스·보험", value: "2,500,000원", confidence: 94 },
      { field: "기타 운영비", value: "620,000원", confidence: 91 },
      { field: "총 경비 합계", value: "39,900,000원", confidence: 96 },
      { field: "월 순이익", value: "13,260,000원", confidence: 95 },
      { field: "순이익률", value: "17.0%", confidence: 95 },
    ];
  }
};

const STATUS_COLOR = { normal: "#00C853", warning: "#FFB300", critical: "#FF3B30" };
const STATUS_LABEL = { normal: "✅ 정상", warning: "⚠️ 주의", critical: "🚨 위기" };
const MAGENTA_FIELDS = ["총 경비 합계", "월 순이익", "순이익률"];

export default function QuestScan() {
  const insets = useSafeAreaInsets();
  const { completeQuest } = useAppContext();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [attachName, setAttachName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [scannedDocs, setScannedDocs] = useState<Record<string, ParsedItem[]>>({});
  const [allDone, setAllDone] = useState(false);
  const [sheetType, setSheetType] = useState<string | null>(null);

  const scannedCount = Object.keys(scannedDocs).length;
  const allScanned = scannedCount === SCAN_TYPES.length;

  const openSheet = (typeId: string) => {
    setSelectedType(typeId);
    setSheetType(typeId);
  };

  const closeSheet = () => setSheetType(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleCamera = async () => {
    closeSheet();
    await delay(350); // Modal 애니메이션 완료 대기
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("카메라 권한 필요", "설정 > myBrain > 카메라를 허용해 주세요.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) processFile(result.assets[0].uri, result.assets[0].fileName ?? "사진.jpg");
  };

  const handleGallery = async () => {
    closeSheet();
    await delay(350);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("앨범 권한 필요", "설정 > myBrain > 사진을 허용해 주세요.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) processFile(result.assets[0].uri, result.assets[0].fileName ?? "이미지.jpg");
  };

  const handleFilePicker = async () => {
    closeSheet();
    await delay(350);
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.type === "success") {
      processFile(result.uri, result.name);
    }
  };

  const handleDemoScan = () => {
    closeSheet();
    // 파일 첨부 없이 mock OCR 바로 실행
    setImageUri("demo");
    setAttachName("데모 스캔");
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => { setScanning(false); setParsed(getMockParsed(selectedType)); }, 1800);
  };

  const processFile = async (uri: string, name: string) => {
    setImageUri(uri);
    setAttachName(name);
    setScanning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => { setScanning(false); setParsed(getMockParsed(selectedType)); }, 2500);
  };

  const handleConfirmScan = async () => {
    if (!selectedType || !parsed) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = { ...scannedDocs, [selectedType]: parsed };
    setScannedDocs(updated);
    setImageUri(null);
    setAttachName(null);
    setParsed(null);
    setSelectedType(null);
  };

  const handleFinish = async () => {
    setAllDone(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeQuest("quest3");
    setTimeout(() => router.replace("/(quest)"), 1200);
  };

  if (allDone) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={["#E8FFF0", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
        <View style={styles.successBlock}>
          <Feather name="zap" size={48} color="#00C853" />
          <Text style={styles.successText}>20대 지표 완성!</Text>
          <Text style={styles.successSubtext}>AI 관제탑으로 이동 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#E8FFF0", "#FFFFFF"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (parsed) { setImageUri(null); setParsed(null); }
            else if (imageUri) { setImageUri(null); }
            else router.back();
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color="#00153D" />
        </TouchableOpacity>
        <View style={styles.badge}><Text style={styles.badgeText}>QUEST 3</Text></View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{scannedCount} / {SCAN_TYPES.length} 완료</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 서류 선택 & 카메라 */}
        {!imageUri && !parsed && (
          <>
            <Feather name="file-text" size={36} color="#00C853" />
            <Text style={styles.title}>재무 서류 스캔</Text>

            {/* 진행 바 */}
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBarFill, { width: `${(scannedCount / SCAN_TYPES.length) * 100}%` as any }]} />
            </View>

            <View style={styles.typeGrid}>
              {SCAN_TYPES.map((t) => {
                const done = !!scannedDocs[t.id];
                const active = selectedType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeCard, active && styles.typeCardSelected, done && styles.typeCardDone]}
                    onPress={() => openSheet(t.id)}
                    activeOpacity={0.8}
                  >
                    {done && (
                      <View style={styles.doneOverlay}>
                        <Feather name="check-circle" size={18} color="#00C853" />
                      </View>
                    )}
                    <Feather name={t.icon} size={20} color={done ? "#00C853" : active ? "#00C853" : "#64748B"} />
                    <Text style={[styles.typeLabel, (active || done) && styles.typeLabelSelected]}>{t.label}</Text>
                    <Text style={styles.typeDesc}>{t.desc}</Text>
                    <View style={[styles.kpiBadge, (active || done) && styles.kpiBadgeSelected]}>
                      <Text style={[styles.kpiText, (active || done) && styles.kpiTextSelected]}>{t.kpi}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.finishBtn, allScanned ? styles.finishBtnAll : styles.btnDisabled]}
              onPress={allScanned ? handleFinish : undefined}
              disabled={!allScanned}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.finishBtnText}>
                {allScanned ? "20대 지표 완성 — 대시보드 반영" : `${scannedCount} / 8 완료 — 8종 모두 입력해주세요`}
              </Text>
            </TouchableOpacity>

            {/* 완료된 서류 KPI 요약 목록 */}
            {scannedCount > 0 && (
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryTitle}>수집된 KPI 지표</Text>
                {SCAN_TYPES.filter((t) => scannedDocs[t.id]).map((t) => {
                  const insight = KPI_INSIGHT[t.id];
                  const color = STATUS_COLOR[insight.status];
                  return (
                    <View key={t.id} style={styles.summaryRow}>
                      <View style={styles.summaryLeft}>
                        <Feather name={t.icon} size={14} color={color} />
                        <View style={styles.summaryTextCol}>
                          <Text style={styles.summaryDocName}>{t.label}</Text>
                          <Text style={styles.summaryKpiName}>{insight.kpiName}</Text>
                        </View>
                      </View>
                      <View style={styles.summaryRight}>
                        <Text style={[styles.summaryValue, { color }]}>{insight.value}</Text>
                        <Text style={styles.summaryBench}>{insight.benchmark}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: color + "18" }]}>
                          <Text style={[styles.statusBadgeText, { color }]}>{STATUS_LABEL[insight.status]}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* OCR 스캔 중 — 로딩 시 이미지 숨김 */}
        {imageUri && !parsed && (
          <View style={styles.scanningBlock}>
            {scanning ? (
              <View style={styles.scanLoadingBox}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={styles.scanningText}>AI OCR 분석 중...</Text>
                <Text style={styles.scanningSubtext}>문서 종류 감지 → 수치 추출 → 검증</Text>
              </View>
            ) : imageUri === "demo" ? (
              <View style={styles.filePreview}>
                <Feather name="zap" size={48} color="#00C853" />
                <Text style={styles.filePreviewName}>AI 데모 스캔</Text>
              </View>
            ) : attachName?.match(/\.(jpg|jpeg|png|heic|webp)$/i) ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.filePreview}>
                <Feather name="file-text" size={48} color="#33A6FF" />
              </View>
            )}
          </View>
        )}

        {/* OCR 결과 */}
        {parsed && (
          <View style={styles.parsedBlock}>
            <View style={styles.parsedHeader}>
              <Feather name="check-circle" size={20} color="#00C853" />
              <Text style={styles.parsedTitle}>OCR 분석 완료</Text>
              {selectedType && <Text style={styles.parsedDocLabel}>{SCAN_TYPES.find(t => t.id === selectedType)?.label}</Text>}
            </View>
            {parsed.map((item, i) => {
              const isMagenta = MAGENTA_FIELDS.includes(item.field);
              return (
                <View key={i} style={[styles.parsedRow, isMagenta && styles.parsedRowHighlight]}>
                  <View style={styles.parsedLeft}>
                    <Text style={[styles.parsedField, isMagenta && { color: "#C2185B", fontWeight: "700" as const }]}>{item.field}</Text>
                    <View style={styles.confidenceBar}>
                      <View style={[styles.confidenceFill, { width: `${item.confidence}%` as any, backgroundColor: isMagenta ? "#C2185B" : "#00C853" }]} />
                    </View>
                  </View>
                  <Text style={[styles.parsedValue, isMagenta && { color: "#C2185B", fontSize: 16 }]}>{item.value}</Text>
                </View>
              );
            })}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmScan} activeOpacity={0.85}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>확인 — 다음 서류 입력</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* 첨부 방법 선택 바텀 시트 */}
      <Modal visible={!!sheetType} transparent animationType="slide" onRequestClose={closeSheet}>
        <Pressable style={styles.sheetBackdrop} onPress={closeSheet} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {SCAN_TYPES.find(t => t.id === sheetType)?.label} 첨부
          </Text>
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

          <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={handleDemoScan} activeOpacity={0.8}>
            <View style={[styles.sheetIconWrap, { backgroundColor: "#F0FFF4" }]}>
              <Feather name="zap" size={22} color="#00C853" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetOptionTitle}>바로 스캔 (데모)</Text>
              <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>파일 없이 AI OCR 결과 미리보기</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet} activeOpacity={0.7}>
            <Text style={styles.sheetCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 4 },
  badge: { backgroundColor: "#E8FFF0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#00C853", fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  progressPill: { marginLeft: "auto", backgroundColor: "#F1F5F9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  progressText: { fontSize: 12, fontWeight: "700" as const, color: "#00153D" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48, gap: 16, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800" as const, color: "#00153D", textAlign: "center" },
  progressBarWrap: { width: "100%", height: 6, backgroundColor: "#E8EDF5", borderRadius: 3, overflow: "hidden" as const },
  progressBarFill: { height: "100%" as any, backgroundColor: "#00C853", borderRadius: 3 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", width: "100%" },
  typeCard: {
    width: "46%", backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 2, borderColor: "#E8EDF5",
    padding: 11, alignItems: "center", gap: 4,
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  typeCardSelected: { borderColor: "#00C853", backgroundColor: "#F0FFF4" },
  typeCardDone: { borderColor: "#00C853", backgroundColor: "#F0FFF4", opacity: 0.85 },
  doneOverlay: { position: "absolute", top: 6, right: 6 },
  typeLabel: { fontSize: 15, fontWeight: "700" as const, color: "#64748B", textAlign: "center" },
  typeLabelSelected: { color: "#00C853" },
  typeDesc: { fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 16 },
  kpiBadge: { backgroundColor: "#F1F5F9", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  kpiBadgeSelected: { backgroundColor: "#DCFCE7" },
  kpiText: { fontSize: 11, color: "#64748B", fontWeight: "600" as const },
  kpiTextSelected: { color: "#16A34A" },
  cameraBtn: {
    backgroundColor: "#00C853", borderRadius: 14, paddingVertical: 15, width: "100%",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnDisabled: { backgroundColor: "#CBD5E1" },
  cameraBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  finishBtn: {
    backgroundColor: "#33A6FF", borderRadius: 14, paddingVertical: 15, width: "100%",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  finishBtnAll: { backgroundColor: "#00153D" },
  finishBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" as const },
  summaryBlock: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: "#E8EDF5",
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  summaryTitle: { fontSize: 14, fontWeight: "800" as const, color: "#00153D", marginBottom: 2 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  summaryTextCol: { flex: 1 },
  summaryDocName: { fontSize: 11, color: "#64748B" },
  summaryKpiName: { fontSize: 12, fontWeight: "700" as const, color: "#00153D" },
  summaryRight: { alignItems: "flex-end", gap: 2 },
  summaryValue: { fontSize: 16, fontWeight: "800" as const },
  summaryBench: { fontSize: 9, color: "#94A3B8" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusBadgeText: { fontSize: 9, fontWeight: "700" as const },
  scanningBlock: { width: "100%", borderRadius: 16, overflow: "hidden", position: "relative" },
  scanLoadingBox: { width: "100%", height: 200, borderRadius: 16, backgroundColor: "#F0FFF4", alignItems: "center", justifyContent: "center", gap: 12 },
  previewImage: { width: "100%", height: 200, borderRadius: 16 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF88", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16,
  },
  scanningText: { color: "#00C853", fontSize: 16, fontWeight: "700" as const },
  scanningSubtext: { color: "#64748B", fontSize: 12 },
  parsedBlock: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, gap: 12,
    borderWidth: 1, borderColor: "#E8EDF5",
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  parsedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  parsedTitle: { fontSize: 15, fontWeight: "700" as const, color: "#00C853" },
  parsedDocLabel: { marginLeft: "auto", fontSize: 11, color: "#64748B", fontWeight: "600" as const },
  parsedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  parsedRowHighlight: { backgroundColor: "#FFF0F5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginHorizontal: -8 },
  parsedLeft: { flex: 1, gap: 4 },
  parsedField: { fontSize: 12, color: "#64748B" },
  confidenceBar: { height: 3, backgroundColor: "#E8EDF5", borderRadius: 2, overflow: "hidden" as const },
  confidenceFill: { height: "100%" as any, backgroundColor: "#00C853", borderRadius: 2 },
  parsedValue: { fontSize: 14, fontWeight: "700" as const, color: "#00153D" },
  confirmBtn: {
    backgroundColor: "#33A6FF", borderRadius: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  successBlock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  successText: { fontSize: 24, fontWeight: "800" as const, color: "#00153D" },
  successSubtext: { fontSize: 14, color: "#64748B" },
  filePreview: {
    width: "100%", height: 160, backgroundColor: "#F8FAFF", borderRadius: 16,
    alignItems: "center", justifyContent: "center", gap: 12,
    borderWidth: 1, borderColor: "#E8EDF5",
  },
  filePreviewName: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 16 },
  sheetBackdrop: { flex: 1, backgroundColor: "#00000050" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: "800" as const, color: "#00153D", marginBottom: 2 },
  sheetSub: { fontSize: 12, color: "#94A3B8", marginBottom: 8 },
  sheetOption: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  sheetIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetOptionText: { flex: 1 },
  sheetOptionTitle: { fontSize: 15, fontWeight: "700" as const, color: "#00153D" },
  sheetOptionDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  sheetCancel: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  sheetCancelText: { fontSize: 15, color: "#94A3B8", fontWeight: "600" as const },
});
