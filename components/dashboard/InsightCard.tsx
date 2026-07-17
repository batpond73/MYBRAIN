import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// 각 섹션 최상단에 놓는 통합 인사이트 카드. 20개 지표 중 그 섹션이
// 관장하는 지표들의 상관·gap을 사람 말로 정리한 문구를 보여준다.
export function InsightCard({ tone, text }: { tone: "profit" | "retention" | "risk"; text: string }) {
  const color =
    tone === "profit"    ? "#8B5CF6" :
    tone === "retention" ? "#33A6FF" :
    "#FF3B30";
  const bg =
    tone === "profit"    ? "#F5F3FF" :
    tone === "retention" ? "#EBF5FF" :
    "#FFF5F4";
  const icon =
    tone === "profit"    ? "trending-up" :
    tone === "retention" ? "repeat" :
    "alert-triangle";
  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor: `${color}44` }]}>
      <Feather name={icon as any} size={14} color={color} style={{ marginTop: 2 }} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  text: { flex: 1, fontSize: 12, color: "#334155", lineHeight: 18 },
});
