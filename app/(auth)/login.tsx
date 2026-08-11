import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, allQuestsCompleted } = useAppContext();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  // 로그인 성공 후 이동 목적지: 관제탑 3단계 미완료면 (quest), 완료면 dashboard.
  // 기존엔 무조건 /(tabs)로 replace해 2단계 리다이렉트가 걸리던 걸 정리.
  const afterLogin = () => allQuestsCompleted ? "/dashboard" as const : "/(quest)" as const;

  const handleLogin = async () => {
    if (!userId || !password) { setError("아이디와 비밀번호를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // clinicName은 명시하지 않음 · 이전 세션 값 유지 · 최초라면 설정에서 입력
    await login(userId);
    setLoading(false);
    router.replace(afterLogin());
  };

  const handleAppleMock = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await login("apple_user");
    router.replace(afterLogin());
  };

  const handleGoogleMock = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await login("google_user");
    router.replace(afterLogin());
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        {/* 로고 블록 */}
        <View style={styles.logoBlock}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="contain" />
          <Text style={styles.appName}>MYBRAIN</Text>
          <Text style={styles.tagline}>병원장 전용 AI 경영 관제탑</Text>
        </View>

        {/* 폼 블록 */}
        <View style={styles.formBlock}>
          <Text style={styles.formTitle}>다시 오셨군요, 원장님</Text>

          {/* 소셜 로그인 */}
          <TouchableOpacity style={styles.socialBtn} onPress={handleAppleMock} activeOpacity={0.85}>
            <Feather name="smartphone" size={18} color="#00153D" />
            <Text style={styles.socialBtnText}>Apple로 계속하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, styles.googleBtn]} onPress={handleGoogleMock} activeOpacity={0.85}>
            <Feather name="globe" size={18} color="#EA4335" />
            <Text style={[styles.socialBtnText, { color: "#00153D" }]}>Google로 계속하기</Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는 아이디로</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 아이디 */}
          <View style={[styles.inputWrapper, focusedField === "userId" && styles.inputFocused]}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              placeholderTextColor="#94A3B8"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => setFocusedField("userId")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* 비밀번호 */}
          <View style={[styles.inputWrapper, focusedField === "pw" && styles.inputFocused]}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onFocus={() => setFocusedField("pw")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={handleLogin}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>로그인</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(auth)/sign-up");
            }}
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              계정이 없으신가요? <Text style={styles.switchAccent}>무료 시작하기</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  kav: { flex: 1, paddingHorizontal: 28, justifyContent: "center", gap: 36 },
  logoBlock: { alignItems: "center", gap: 6 },
  logo: { width: 72, height: 72 },
  appName: { fontSize: 18, fontWeight: "800" as const, color: "#00153D", letterSpacing: 3 },
  tagline: { fontSize: 13, color: "#33A6FF", fontWeight: "500" as const, letterSpacing: 0.3 },
  formBlock: { gap: 12 },
  formTitle: { fontSize: 24, fontWeight: "800" as const, color: "#00153D", marginBottom: 4 },
  socialBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
  },
  googleBtn: { backgroundColor: "#FFFFFF" },
  socialBtnText: { fontSize: 15, fontWeight: "600" as const, color: "#00153D" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F1F5F9" },
  dividerText: { fontSize: 12, color: "#94A3B8" },
  inputWrapper: {
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: "#E2E8F0",
    paddingHorizontal: 16, justifyContent: "center",
  },
  inputFocused: { borderColor: "#33A6FF", backgroundColor: "#FAFEFF" },
  input: { fontSize: 15, color: "#00153D" },
  errorText: { color: "#FF3B30", fontSize: 12, textAlign: "center" },
  ctaBtn: {
    height: 54, borderRadius: 14, backgroundColor: "#00153D",
    alignItems: "center", justifyContent: "center", marginTop: 4,
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  switchLink: { alignItems: "center", paddingVertical: 4 },
  switchText: { color: "#94A3B8", fontSize: 14 },
  switchAccent: { color: "#33A6FF", fontWeight: "600" as const },
});
