import { Redirect } from "expo-router";
import React from "react";

import { useAppContext } from "@/context/AppContext";

export default function HomeIndex() {
  const { isLoaded, isAuthenticated, hasSeenIntro, allQuestsCompleted } = useAppContext();

  // Wait for the Root Layout to finish mounting before navigating.
  // Otherwise Expo Router throws "Attempted to navigate before mounting the Root Layout".
  if (!isLoaded) return null;

  if (!hasSeenIntro) return <Redirect href="/intro" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-up" />;
  if (!allQuestsCompleted) return <Redirect href="/(quest)" />;
  return <Redirect href="/dashboard" />;
}
