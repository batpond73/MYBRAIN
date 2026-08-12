import { Image } from "expo-image";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NpsSurveyForm } from "@/components/help/NpsSurveyForm";

/**
 * /survey — 로그인 없이 접근 가능한 공개 라우트. 태블릿·환자용 폼.
 *
 * 원장이 태블릿 브라우저에 이 URL을 열어 데스크에 배치하면 환자가
 * 응답 → 태블릿 로컬 스토리지에 저장. 원장 폰과의 실시간 동기화는
 * 백엔드 추가 후 자동으로 켜진다 (lib/npsStorage.ts의 saveResponse
 * TODO 지점 참고).
 */
export default function SurveyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
      >
        <View style={styles.brandRow}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          accessibilityLabel="myBrain 로고" />
          <View>
            <Text style={styles.brand}>myBrain 진료 만족도 설문</Text>
            <Text style={styles.brandSub}>익명 · 응답은 원장이 직접 검토합니다</Text>
          </View>
        </View>

        <NpsSurveyForm mode="collect" />

        <Text style={styles.footer}>
          {Platform.OS === "web"
            ? "이 페이지의 URL을 태블릿 브라우저에 열어두시면 환자가 순서대로 응답할 수 있습니다."
            : "환자용 페이지"}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  content: { padding: 16, gap: 14, maxWidth: 720, alignSelf: "center", width: "100%" },
  brandRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E8EDF5",
  },
  logo: { width: 44, height: 44 },
  brand: { fontSize: 15, fontWeight: "800" as const, color: "#00153D" },
  brandSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  footer: {
    textAlign: "center" as const, fontSize: 10, color: "#CBD5E1",
    marginTop: 10, lineHeight: 15,
  },
});
