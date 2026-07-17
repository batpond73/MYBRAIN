import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

// react-native-web renders TextInput as native <input>/<textarea>, so the
// browser draws its default focus ring inside the styled wrapper. Kill it
// once at the root — new inputs added later inherit the reset for free.
if (Platform.OS === "web" && typeof document !== "undefined") {
  const STYLE_ID = "mybrain-input-reset";
  if (!document.getElementById(STYLE_ID)) {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      input, textarea, select, [contenteditable="true"] {
        outline: none !important;
        -webkit-tap-highlight-color: transparent;
      }
      input:focus, input:focus-visible,
      textarea:focus, textarea:focus-visible,
      select:focus, select:focus-visible,
      [contenteditable="true"]:focus,
      [contenteditable="true"]:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(el);
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="intro" options={{ animation: "fade" }} />
      <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
      <Stack.Screen name="(quest)" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="dashboard" options={{ animation: "fade" }} />
      <Stack.Screen name="daily-receipt" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="help" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="survey" options={{ animation: "fade" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
