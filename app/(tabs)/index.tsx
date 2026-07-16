import { Redirect } from "expo-router";
import React from "react";

import { useAppContext } from "@/context/AppContext";

export default function HomeIndex() {
  const { isAuthenticated, hasSeenIntro, allQuestsCompleted } = useAppContext();

  if (!hasSeenIntro) return <Redirect href="/intro" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-up" />;
  if (!allQuestsCompleted) return <Redirect href="/(quest)" />;
  return <Redirect href="/dashboard" />;
}
