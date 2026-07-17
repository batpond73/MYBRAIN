import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import {
  clearResponses,
  importAndMerge,
  loadResponses,
  responsesToCsv,
  summarize,
  type NpsResponse,
  type NpsSummary,
} from "@/lib/npsStorage";

/**
 * 태블릿 배포 + 응답 집계 카드. 도움말 페이지의 NPS 폼 밑에 배치.
 *
 * 세 블록:
 *  1) 내보내기 링크 · QR — 원장이 태블릿에 열 URL
 *  2) 수집된 응답 집계 — 이 기기에 저장된 응답을 실시간 집계
 *  3) CSV 교환 · 초기화 — 태블릿 → 원장 앱 파일 다리 (백엔드 없을 때)
 */
export function NpsExportCard() {
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const list = await loadResponses();
    setResponses(list);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const summary: NpsSummary = useMemo(() => summarize(responses), [responses]);
  const tabletCount = responses.filter((r) => r.source === "tablet").length;
  const demoCount = responses.length - tabletCount;

  // 태블릿에 열 URL. web일 때는 현재 origin 기준으로 정확한 절대 URL,
  // native일 때는 정보 표시용으로 상대 경로.
  const surveyUrl = useMemo(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return `${window.location.origin}/survey`;
    }
    return "/survey";
  }, []);

  const copyUrl = async () => {
    try { await Haptics.selectionAsync(); } catch {}
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(surveyUrl);
        Alert.alert("복사 완료", "설문 URL을 클립보드에 복사했습니다.");
      } catch {
        Alert.alert("복사 실패", surveyUrl);
      }
    } else {
      Alert.alert("설문 URL", surveyUrl);
    }
  };

  const openInNewTab = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(surveyUrl, "_blank", "noopener,noreferrer");
    }
  };

  const downloadCsv = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    if (responses.length === 0) {
      Alert.alert("응답 없음", "먼저 설문 응답을 수집해주세요.");
      return;
    }
    const csv = responsesToCsv(responses);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      // Web: Blob → data URL → 자동 다운로드
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `mybrain-nps-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } else {
      Alert.alert("웹 브라우저에서 사용하세요", "CSV 다운로드는 웹 환경에서만 지원됩니다.");
    }
  };

  const importCsv = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      Alert.alert("웹 브라우저에서 사용하세요", "파일 불러오기는 웹 환경에서만 지원됩니다.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const text = await file.text();
        const result = await importAndMerge(text);
        Alert.alert(
          "불러오기 완료",
          `추가 ${result.added}건 · 중복 스킵 ${result.skipped}건`
        );
        await reload();
      } catch (e: any) {
        Alert.alert("불러오기 실패", e?.message ?? "CSV 파싱 오류");
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  const wipe = () => {
    Alert.alert(
      "응답 초기화",
      `저장된 응답 ${responses.length}건을 모두 삭제합니다. 되돌릴 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await clearResponses();
            await reload();
          },
        },
      ]
    );
  };

  const npsColor =
    summary.nps >= 40 ? "#00C853" :
    summary.nps >= 20 ? "#33A6FF" :
    summary.nps >= 0  ? "#FFB300" :
    "#FF3B30";

  return (
    <View style={styles.wrap}>
      {/* ── 1. 배포 URL · QR ─────────────────────────── */}
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <Feather name="share-2" size={13} color="#33A6FF" />
          <Text style={styles.blockTitle}>태블릿에 설문 열기</Text>
        </View>
        <Text style={styles.blockHint}>
          아래 URL 또는 QR을 태블릿에서 열면 환자용 설문 화면이 뜹니다.
          응답은 태블릿 브라우저에 저장됩니다.
        </Text>

        <View style={styles.qrRow}>
          <View style={styles.qrBox}>
            <QRCode value={surveyUrl} size={120} />
          </View>
          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>설문 URL</Text>
            <Text style={styles.urlValue} numberOfLines={2} selectable>{surveyUrl}</Text>
            <View style={styles.urlBtnRow}>
              <TouchableOpacity style={styles.urlBtn} onPress={copyUrl} activeOpacity={0.85}>
                <Feather name="copy" size={12} color="#33A6FF" />
                <Text style={styles.urlBtnText}>복사</Text>
              </TouchableOpacity>
              {Platform.OS === "web" && (
                <TouchableOpacity style={[styles.urlBtn, styles.urlBtnPrimary]} onPress={openInNewTab} activeOpacity={0.85}>
                  <Feather name="external-link" size={12} color="#FFFFFF" />
                  <Text style={[styles.urlBtnText, { color: "#FFFFFF" }]}>새 창으로 열기</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* ── 2. 수집 응답 집계 ─────────────────────────── */}
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <Feather name="bar-chart-2" size={13} color="#8B5CF6" />
          <Text style={styles.blockTitle}>수집된 응답 · 이 기기</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={reload} activeOpacity={0.7} style={styles.reloadBtn}>
            <Feather name="refresh-cw" size={12} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {responses.length === 0 ? (
          <Text style={styles.emptyText}>아직 응답이 없습니다. 태블릿에서 URL을 열어 첫 응답을 받아보세요.</Text>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryNps}>
                <Text style={styles.summaryNpsLabel}>NPS</Text>
                <Text style={[styles.summaryNpsValue, { color: npsColor }]}>{summary.nps}</Text>
                <Text style={styles.summaryNpsRange}>-100 ~ +100</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <SummaryBar label="추천자 (9-10)" count={summary.promoter} total={summary.count} color="#00C853" />
                <SummaryBar label="중립 (7-8)"    count={summary.passive}  total={summary.count} color="#33A6FF" />
                <SummaryBar label="비판자 (0-6)"  count={summary.detractor} total={summary.count} color="#FF3B30" />
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>총 {summary.count}건 · 태블릿 {tabletCount} · 원장 데모 {demoCount}</Text>
              <Text style={styles.metaText}>평균 점수 {summary.averageScore}</Text>
            </View>

            <View style={styles.subGrid}>
              <SubCell label="예약 편의" v={summary.averageSub.booking} />
              <SubCell label="대기시간" v={summary.averageSub.wait} />
              <SubCell label="진료 설명" v={summary.averageSub.explain} />
              <SubCell label="스태프 친절" v={summary.averageSub.kindness} />
            </View>
          </>
        )}
      </View>

      {/* ── 3. CSV 교환 · 초기화 ────────────────────── */}
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <Feather name="folder" size={13} color="#F97316" />
          <Text style={styles.blockTitle}>CSV 교환</Text>
        </View>
        <Text style={styles.blockHint}>
          태블릿에서 응답을 CSV로 저장 → 원장 앱에서 불러와 병합하면 됩니다.
          백엔드가 연결되기 전까지의 오프라인 다리 역할.
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={downloadCsv} activeOpacity={0.85}>
            <Feather name="download" size={13} color="#FFFFFF" />
            <Text style={styles.actionBtnTextPrimary}>CSV 내보내기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={importCsv} disabled={busy} activeOpacity={0.85}>
            <Feather name="upload" size={13} color="#33A6FF" />
            <Text style={styles.actionBtnText}>{busy ? "처리 중..." : "CSV 불러오기"}</Text>
          </TouchableOpacity>
        </View>
        {responses.length > 0 && (
          <TouchableOpacity style={styles.wipeBtn} onPress={wipe} activeOpacity={0.85}>
            <Feather name="trash-2" size={11} color="#FF3B30" />
            <Text style={styles.wipeBtnText}>이 기기 응답 전체 초기화</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.backendNoteWrap}>
        <Feather name="info" size={11} color="#94A3B8" />
        <Text style={styles.backendNote}>
          실시간 반영(태블릿 → 원장 폰 즉시 표시)은 백엔드가 필요합니다.
          현재는 같은 기기 내에서만 자동 집계되고, 다른 기기 응답은 CSV로 옮기시면 됩니다.
        </Text>
      </View>
    </View>
  );
}

function SummaryBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.sumBarRow}>
      <Text style={styles.sumBarLabel}>{label}</Text>
      <View style={styles.sumBarTrack}>
        <View style={[styles.sumBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.sumBarPct, { color }]}>{count} · {pct}%</Text>
    </View>
  );
}

function SubCell({ label, v }: { label: string; v: number }) {
  return (
    <View style={styles.subCell}>
      <Text style={styles.subCellLabel}>{label}</Text>
      <Text style={styles.subCellVal}>{v > 0 ? v.toFixed(1) : "—"}</Text>
      <Text style={styles.subCellMax}>/5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },

  block: {
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    padding: 12,
    gap: 8,
  },
  blockHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  blockTitle: { fontSize: 12, fontWeight: "800" as const, color: "#00153D", letterSpacing: 0.2 },
  blockHint: { fontSize: 11, color: "#64748B", lineHeight: 16 },

  // QR block
  qrRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  qrBox: {
    padding: 8, backgroundColor: "#FFFFFF", borderRadius: 8,
    borderWidth: 1, borderColor: "#E8EDF5",
  },
  urlBox: { flex: 1, gap: 4 },
  urlLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600" as const },
  urlValue: { fontSize: 12, color: "#00153D", fontWeight: "600" as const, lineHeight: 16 },
  urlBtnRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  urlBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: "#EBF5FF",
  },
  urlBtnPrimary: { backgroundColor: "#33A6FF" },
  urlBtnText: { fontSize: 11, color: "#33A6FF", fontWeight: "700" as const },

  // Summary
  reloadBtn: { padding: 4 },
  emptyText: { fontSize: 11, color: "#94A3B8", lineHeight: 16, paddingVertical: 6 },
  summaryRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  summaryNps: {
    minWidth: 80, alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: "#E8EDF5",
  },
  summaryNpsLabel: { fontSize: 9, color: "#94A3B8", fontWeight: "700" as const },
  summaryNpsValue: { fontSize: 24, fontWeight: "800" as const, marginTop: 2 },
  summaryNpsRange: { fontSize: 8, color: "#CBD5E1", marginTop: 1 },
  sumBarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sumBarLabel: { fontSize: 10, color: "#334155", width: 88 },
  sumBarTrack: { flex: 1, height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  sumBarFill: { height: "100%" },
  sumBarPct: { fontSize: 10, fontWeight: "700" as const, width: 60, textAlign: "right" as const },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  metaText: { fontSize: 10, color: "#94A3B8" },
  subGrid: { flexDirection: "row", gap: 6, marginTop: 6 },
  subCell: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, padding: 8,
    alignItems: "center", borderWidth: 1, borderColor: "#E8EDF5",
  },
  subCellLabel: { fontSize: 9, color: "#64748B", fontWeight: "600" as const, textAlign: "center" as const },
  subCellVal: { fontSize: 15, fontWeight: "800" as const, color: "#00153D", marginTop: 2 },
  subCellMax: { fontSize: 8, color: "#CBD5E1", marginTop: -2 },

  // CSV
  actionRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EBF5FF",
  },
  actionBtnPrimary: { backgroundColor: "#33A6FF" },
  actionBtnText: { fontSize: 12, color: "#33A6FF", fontWeight: "700" as const },
  actionBtnTextPrimary: { fontSize: 12, color: "#FFFFFF", fontWeight: "700" as const },
  wipeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 6, marginTop: 4,
  },
  wipeBtnText: { fontSize: 10, color: "#FF3B30", fontWeight: "600" as const },

  backendNoteWrap: { flexDirection: "row", gap: 6, paddingHorizontal: 4, alignItems: "flex-start" },
  backendNote: { flex: 1, fontSize: 10, color: "#94A3B8", lineHeight: 14 },
});
