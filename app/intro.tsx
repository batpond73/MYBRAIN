import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";

import { useAppContext } from "@/context/AppContext";

export default function IntroScreen() {
  const { isAuthenticated, allQuestsCompleted, markIntroSeen } = useAppContext();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.82)).current;

  const navigated = useRef(false);

  const navigate = async () => {
    if (navigated.current) return;
    navigated.current = true;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    await markIntroSeen();
    if (isAuthenticated) {
      router.replace(allQuestsCompleted ? "/dashboard" : "/(quest)");
    } else {
      router.replace("/(auth)/sign-up");
    }
  };

  useEffect(() => {
    // Web: skip long heartbeat, navigate quickly
    if (Platform.OS === "web") {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(logoScale,   { toValue: 1, duration: 600, useNativeDriver: false }),
      ]).start();
      const timer = setTimeout(navigate, 1500);
      return () => clearTimeout(timer);
    }

    // Native: full heartbeat animation
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.18, duration: 80,  useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 0.96, duration: 65,  useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1.09, duration: 65,  useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1.0,  duration: 225, useNativeDriver: true }),
          Animated.delay(800),
        ]),
        { iterations: 5 }
      ).start(navigate);
    });

    // Safety fallback
    const timer = setTimeout(navigate, 7200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable style={styles.container} onPress={navigate}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 260,
    height: 260,
  },
});
