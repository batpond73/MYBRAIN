import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KPI_HISTORY, KpiHistoryData, KpiStatus, TrendResult } from "@/constants/historyData";

const STATUS_COLOR: Record<KpiStatus, string> = {
  crisis:  "#FF3B30",
  warning: "#FFB300",
  normal:  "#33A6FF",
  best:    "#00C853",
};
const STATUS_BG: Record<KpiStatus, string> = {
  crisis:  "#FFF0EE",
  warning: "#FFF8E7",
  normal:  "#EBF5FF",
  best:    "#E8FFF0",
};
const STATUS_LABEL: Record<KpiStatus, string> = {
  crisis: "위기", warning: "경고", normal: "정상", best: "최상",
};
const RESULT_ICON: Record<TrendResult, { name: "arrow-up" | "arrow-down" | "minus"; color: string }> = {
  improved: { name: "arrow-up",   color: "#00C853" },
  worsened: { name: "arrow-down", color: "#FF3B30" },
  stable:   { name: "minus",      color: "#94A3B8" },
};

type FilterType = "전체" | "개선중" | "악화중" | "위기지속";

function getOverallTrend(data: KpiHistoryData): "improving" | "worsening" | "stable" | "crisis_persist" {
  const entries = data.entries;
  if (entries.length < 2) return "stable";
  const first = entries[0].status;
  const last = entries[entries.length - 1].status;
  const statusRank: Record<KpiStatus, number> = { crisis: 0, warning: 1, normal: 2, best: 3 };
  if (last === "crisis" && first === "crisis") return "crisis_persist";
  if (statusRank[last] > statusRank[first]) return "improving";
  if (statusRank[last] < statusRank[first]) return "worsening";
  return "stable";
}

function matchesFilter(data: KpiHistoryData, filter: FilterType): boolean {
  if (filter === "전체") return true;
  const trend = getOverallTrend(data);
  if (filter === "개선중") return trend === "improving";
  if (filter === "악화중") return trend === "worsening";
  if (filter === "위기지속") return trend === "crisis_persist";
  return true;
}

function Sparkline({ data }: { data: KpiHistoryData }) {
  const entries = data.entries;
  const DOT = 12;
  const SPACING = 36;
  const totalW = SPACING * (entries.length - 1) + DOT;

  return (
    <View style={{ width: totalW, height: 52, position: "relative" }}>
      {entries.map((e, i) => {
        if (i === entries.length - 1) return null;
        const next = entries[i + 1];
        const color1 = STATUS_COLOR[e.status];
        const color2 = STATUS_COLOR[next.status];
        const x1 = i * SPACING + DOT / 2;
        const x2 = (i + 1) * SPACING + DOT / 2;
        return (
          <View
            key={`line-${i}`}
            style={{
              position: "absolute",
              left: x1,
              top: 20,
              width: x2 - x1,
              height: 2,
              backgroundColor: color1,
              opacity: 0.45,
            }}
          />
        );
      })}
      {entries.map((e, i) => {
        const isLast = i === entries.length - 1;
        const size = isLast ? DOT + 4 : DOT;
        return (
          <View key={`dot-${i}`} style={{ position: "absolute", left: i * SPACING, top: isLast ? 18 : 20 }}>
            <View
              style={{
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: STATUS_COLOR[e.status],
                borderWidth: isLast ? 2 : 1,
                borderColor: "#FFFFFF",
                shadowColor: STATUS_COLOR[e.status],
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isLast ? 0.5 : 0,
                shadowRadius: 4,
                elevation: isLast ? 3 : 0,
              }}
            />
            <Text style={{ fontSize: 8, color: "#94A3B8", marginTop: 3, textAlign: "center", width: size }}>
              {e.month.slice(3)}월
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function KpiCard({ data }: { data: KpiHistoryData }) {
  const [expanded, setExpanded] = useState(false);
  const lastEntry = data.entries[data.entries.length - 1];
  const trend = getOverallTrend(data);
  const prevEntry = data.entries[data.entries.length - 2];
  const momChange = prevEntry
    ? ((lastEntry.value - prevEntry.value) / Math.abs(prevEntry.value || 1)) * 100
    : 0;

  const trendConfig = {
    improving:     { label: "개선중",  color: "#00C853", icon: "trending-up"   as const },
    worsening:     { label: "악화중",  color: "#FF3B30", icon: "trending-down" as const },
    stable:        { label: "안정",    color: "#64748B", icon: "minus"         as const },
    crisis_persist:{ label: "위기지속", color: "#FF3B30", icon: "alert-circle"  as const },
  }[trend];

  const actionCount = data.entries.filter((e) => e.action).length;

  return (
    <View style={s.kpiCard}>
      {/* Top row */}
      <TouchableOpacity
        style={s.kpiCardTop}
        activeOpacity={0.75}
        onPress={async () => {
          setExpanded(!expanded);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        {/* Left: name + benchmark */}
        <View style={s.kpiLeft}>
          <View style={s.kpiNameRow}>
            <Text style={s.kpiName}>{data.name}</Text>
            <View style={[s.statusBadge, { backgroundColor: STATUS_BG[lastEntry.status] }]}>
              <Text style={[s.statusBadgeText, { color: STATUS_COLOR[lastEntry.status] }]}>
                {STATUS_LABEL[lastEntry.status]}
              </Text>
            </View>
          </View>
          <View style={s.kpiMetaRow}>
            <View style={[s.trendBadge, { backgroundColor: trendConfig.color + "18" }]}>
              <Feather name={trendConfig.icon} size={10} color={trendConfig.color} />
              <Text style={[s.trendBadgeText, { color: trendConfig.color }]}>{trendConfig.label}</Text>
            </View>
            {actionCount > 0 && (
              <View style={s.actionCountBadge}>
                <Feather name="clipboard" size={9} color="#8B5CF6" />
                <Text style={s.actionCountText}>액션 {actionCount}건</Text>
              </View>
            )}
          </View>
          <Text style={s.kpiBenchmark}>목표 {data.benchmark} · {data.benchmarkDesc}</Text>
        </View>

        {/* Right: sparkline + current value */}
        <View style={s.kpiRight}>
          <Sparkline data={data} />
          <View style={s.currentValueRow}>
            <Text style={[s.currentValue, { color: STATUS_COLOR[lastEntry.status] }]}>
              {typeof lastEntry.value === "number" && lastEntry.value >= 1000
                ? lastEntry.value.toLocaleString()
                : lastEntry.value}
              <Text style={s.unitText}>{data.unit}</Text>
            </Text>
            <View style={s.momRow}>
              <Feather
                name={momChange > 0 ? (data.benefitDirection === "higher" ? "arrow-up" : "arrow-down") : momChange < 0 ? (data.benefitDirection === "higher" ? "arrow-down" : "arrow-up") : "minus"}
                size={10}
                color={momChange === 0 ? "#94A3B8" : (data.benefitDirection === "higher" ? (momChange > 0 ? "#00C853" : "#FF3B30") : (momChange > 0 ? "#FF3B30" : "#00C853"))}
              />
              <Text style={s.momText}>{Math.abs(momChange).toFixed(1)}%</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded timeline */}
      {expanded && (
        <View style={s.timeline}>
          <View style={s.timelineDivider} />
          {data.entries.map((e, idx) => {
            const isFirst = idx === 0;
            const prev = isFirst ? null : data.entries[idx - 1];
            const hasAction = !!e.action;
            return (
              <View key={e.month}>
                <View style={s.timelineRow}>
                  {/* dot + line */}
                  <View style={s.timelineLeft}>
                    <View style={[s.timelineDot, { backgroundColor: STATUS_COLOR[e.status] }]}>
                      <Text style={s.timelineDotText}>{idx + 1}</Text>
                    </View>
                    {idx < data.entries.length - 1 && (
                      <View style={[s.timelineLine, { backgroundColor: STATUS_COLOR[e.status] + "40" }]} />
                    )}
                  </View>

                  {/* content */}
                  <View style={s.timelineContent}>
                    <View style={s.timelineHeader}>
                      <Text style={s.timelineMonth}>{e.month}</Text>
                      <View style={[s.timelineStatusPill, { backgroundColor: STATUS_BG[e.status] }]}>
                        <Text style={[s.timelineStatusText, { color: STATUS_COLOR[e.status] }]}>
                          {STATUS_LABEL[e.status]}
                        </Text>
                      </View>
                      <Text style={[s.timelineValue, { color: STATUS_COLOR[e.status] }]}>
                        {typeof e.value === "number" && e.value >= 1000
                          ? e.value.toLocaleString()
                          : e.value}{data.unit}
                      </Text>
                      {e.result && prev && (
                        <View style={s.resultRow}>
                          <Feather
                            name={RESULT_ICON[e.result].name}
                            size={11}
                            color={RESULT_ICON[e.result].color}
                          />
                        </View>
                      )}
                    </View>

                    {hasAction && (
                      <View style={s.actionBox}>
                        <Feather name="clipboard" size={11} color="#8B5CF6" style={{ marginTop: 1 }} />
                        <Text style={s.actionText}>{e.action}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Summary pill */}
          <View style={s.summaryRow}>
            <View style={[s.summaryPill, { borderColor: trendConfig.color }]}>
              <Feather name={trendConfig.icon} size={12} color={trendConfig.color} />
              <Text style={[s.summaryText, { color: trendConfig.color }]}>
                {STATUS_LABEL[data.entries[0].status]}
                {" "}→{" "}
                {STATUS_LABEL[lastEntry.status]}
                {" "}({trendConfig.label})
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const FILTERS: FilterType[] = ["전체", "개선중", "악화중", "위기지속"];
const FILTER_COUNTS = (filter: FilterType) =>
  filter === "전체" ? KPI_HISTORY.length : KPI_HISTORY.filter((d) => matchesFilter(d, filter)).length;

export default function History() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("전체");

  const filtered = KPI_HISTORY.filter((d) => matchesFilter(d, filter));

  const stats = {
    crisis:   KPI_HISTORY.filter((d) => d.entries.at(-1)?.status === "crisis").length,
    warning:  KPI_HISTORY.filter((d) => d.entries.at(-1)?.status === "warning").length,
    normal:   KPI_HISTORY.filter((d) => d.entries.at(-1)?.status === "normal").length,
    best:     KPI_HISTORY.filter((d) => d.entries.at(-1)?.status === "best").length,
    improving:     KPI_HISTORY.filter((d) => getOverallTrend(d) === "improving").length,
    worsening:     KPI_HISTORY.filter((d) => getOverallTrend(d) === "worsening").length,
    crisis_persist:KPI_HISTORY.filter((d) => getOverallTrend(d) === "crisis_persist").length,
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="chevron-left" size={26} color="#00153D" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>경영 히스토리</Text>
          <Text style={s.headerSub}>25.12 → 26.05 · 6개월 추이</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary dashboard */}
        <View style={s.summaryDash}>
          <View style={s.summaryGrid}>
            {[
              { label: "위기", count: stats.crisis,  color: "#FF3B30", bg: "#FFF0EE" },
              { label: "경고", count: stats.warning, color: "#FFB300", bg: "#FFF8E7" },
              { label: "정상", count: stats.normal,  color: "#33A6FF", bg: "#EBF5FF" },
              { label: "최상", count: stats.best,    color: "#00C853", bg: "#E8FFF0" },
            ].map((item) => (
              <View key={item.label} style={[s.summaryBox, { backgroundColor: item.bg }]}>
                <Text style={[s.summaryCount, { color: item.color }]}>{item.count}</Text>
                <Text style={[s.summaryLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={s.trendSummaryRow}>
            <View style={s.trendItem}>
              <Feather name="trending-up" size={14} color="#00C853" />
              <Text style={[s.trendItemText, { color: "#00C853" }]}>개선중 {stats.improving}개</Text>
            </View>
            <View style={s.trendDividerV} />
            <View style={s.trendItem}>
              <Feather name="trending-down" size={14} color="#FF3B30" />
              <Text style={[s.trendItemText, { color: "#FF3B30" }]}>악화중 {stats.worsening}개</Text>
            </View>
            <View style={s.trendDividerV} />
            <View style={s.trendItem}>
              <Feather name="alert-circle" size={14} color="#FF3B30" />
              <Text style={[s.trendItemText, { color: "#FF3B30" }]}>위기지속 {stats.crisis_persist}개</Text>
            </View>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filterContent}>
          {FILTERS.map((f) => {
            const cnt = FILTER_COUNTS(f);
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[s.filterTab, active && s.filterTabActive]}
                onPress={async () => { setFilter(f); await Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[s.filterTabText, active && s.filterTabTextActive]}>{f}</Text>
                <View style={[s.filterCnt, active && s.filterCntActive]}>
                  <Text style={[s.filterCntText, active && s.filterCntTextActive]}>{cnt}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* KPI cards */}
        <View style={s.list}>
          {filtered.map((d) => (
            <KpiCard key={d.key} data={d} />
          ))}
          <Text style={s.footer}>탭하면 월별 상세 타임라인이 펼쳐집니다</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#F5F7FA" },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E8EDF5" },
  backBtn:      { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 17, fontWeight: "700" as const, color: "#00153D", textAlign: "center" },
  headerSub:    { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 1 },

  summaryDash:     { margin: 16, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryGrid:     { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryBox:      { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 },
  summaryCount:    { fontSize: 22, fontWeight: "800" as const },
  summaryLabel:    { fontSize: 11, fontWeight: "700" as const },
  trendSummaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0 },
  trendItem:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  trendItemText:   { fontSize: 12, fontWeight: "700" as const },
  trendDividerV:   { width: 1, height: 16, backgroundColor: "#E8EDF5" },

  filterBar:    { paddingLeft: 16 },
  filterContent:{ gap: 8, paddingRight: 16, paddingVertical: 8 },
  filterTab:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: "#E8EDF5" },
  filterTabActive: { backgroundColor: "#00153D", borderColor: "#00153D" },
  filterTabText:   { fontSize: 13, fontWeight: "600" as const, color: "#64748B" },
  filterTabTextActive: { color: "#FFFFFF" },
  filterCnt:       { backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  filterCntActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  filterCntText:   { fontSize: 11, fontWeight: "700" as const, color: "#64748B" },
  filterCntTextActive: { color: "#FFFFFF" },

  list:  { padding: 16, paddingTop: 0, gap: 10 },
  footer:{ textAlign: "center", fontSize: 11, color: "#CBD5E1", marginTop: 8, marginBottom: 16 },

  kpiCard:    { backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden", shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  kpiCardTop: { flexDirection: "row", padding: 16, gap: 12 },
  kpiLeft:    { flex: 1, gap: 5 },
  kpiNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kpiName:    { fontSize: 14, fontWeight: "700" as const, color: "#00153D", flexShrink: 1 },
  statusBadge:     { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" as const },
  kpiMetaRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
  trendBadge:  { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  trendBadgeText: { fontSize: 10, fontWeight: "700" as const },
  actionCountBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F3F0FF", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  actionCountText:  { fontSize: 10, fontWeight: "700" as const, color: "#8B5CF6" },
  kpiBenchmark: { fontSize: 10, color: "#94A3B8" },

  kpiRight:       { alignItems: "flex-end", gap: 4 },
  currentValueRow:{ alignItems: "flex-end" },
  currentValue:   { fontSize: 18, fontWeight: "800" as const },
  unitText:       { fontSize: 11, fontWeight: "500" as const },
  momRow:         { flexDirection: "row", alignItems: "center", gap: 2 },
  momText:        { fontSize: 10, color: "#94A3B8" },

  timeline:        { paddingHorizontal: 16, paddingBottom: 14 },
  timelineDivider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 },
  timelineRow:     { flexDirection: "row", gap: 10, marginBottom: 0 },
  timelineLeft:    { alignItems: "center", width: 24 },
  timelineDot:     { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", zIndex: 1 },
  timelineDotText: { fontSize: 10, fontWeight: "700" as const, color: "#FFFFFF" },
  timelineLine:    { width: 2, flex: 1, minHeight: 20 },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineHeader:  { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  timelineMonth:   { fontSize: 12, fontWeight: "700" as const, color: "#00153D" },
  timelineStatusPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  timelineStatusText: { fontSize: 10, fontWeight: "700" as const },
  timelineValue:   { fontSize: 13, fontWeight: "800" as const, marginLeft: "auto" as any },
  resultRow:       { marginLeft: 2 },
  actionBox:       { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#F3F0FF", borderRadius: 8, padding: 8, marginTop: 6 },
  actionText:      { flex: 1, fontSize: 11, color: "#5B21B6", lineHeight: 16 },

  summaryRow:  { marginTop: 4 },
  summaryPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
  summaryText: { fontSize: 12, fontWeight: "700" as const },
});
