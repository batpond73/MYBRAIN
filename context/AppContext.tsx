import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface DoctorProfile {
  speedSlider: number;
  communicationSlider: number;
  chairSlider: number;
  managementType: "A" | "B" | null;
}

interface AppState {
  isAuthenticated: boolean;
  hasSeenIntro: boolean;
  userId: string;
  clinicName: string;
  clinicTenureYears: number;
  questsCompleted: { quest1: boolean; quest2: boolean; quest3: boolean };
  doctorProfile: DoctorProfile;
  period: "today" | "week" | "month" | "quarter";
  isDarkMode: boolean;
}

interface AppContextType extends AppState {
  isLoaded: boolean;
  login: (userId: string, clinicName: string) => Promise<void>;
  logout: () => Promise<void>;
  completeQuest: (quest: "quest1" | "quest2" | "quest3") => Promise<void>;
  setDoctorProfile: (profile: Partial<DoctorProfile>) => void;
  setPeriod: (period: "today" | "week" | "month" | "quarter") => void;
  toggleDarkMode: () => void;
  markIntroSeen: () => Promise<void>;
  allQuestsCompleted: boolean;
}

const defaultState: AppState = {
  isAuthenticated: false,
  hasSeenIntro: false,
  userId: "",
  clinicName: "",
  clinicTenureYears: 3, // v0.4: REL 판정용 개원 연차 (0=신규, 3=안정기, 7+=성숙)
  questsCompleted: { quest1: false, quest2: false, quest3: false },
  doctorProfile: { speedSlider: 0.5, communicationSlider: 0.5, chairSlider: 0.5, managementType: null },
  period: "today",
  isDarkMode: false,
};

const AppContext = createContext<AppContextType>({
  ...defaultState,
  isLoaded: false,
  login: async () => {},
  logout: async () => {},
  completeQuest: async () => {},
  setDoctorProfile: () => {},
  setPeriod: () => {},
  toggleDarkMode: () => {},
  markIntroSeen: async () => {},
  allQuestsCompleted: false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("mybrain_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          // hasSeenIntro도 저장·복원 (웹 새로고침마다 intro 재생 방지).
          // 이전엔 명시적으로 리셋하던 걸 정정 — 재로그인·재방문 UX 마찰 큼.
          setState({ ...defaultState, ...parsed });
        }
      } catch {} finally {
        // Gate initial navigation until AsyncStorage restore settles,
        // so children (e.g. (tabs)/index.tsx) don't fire <Redirect> before
        // the Root Layout finishes mounting.
        setIsLoaded(true);
      }
    })();
  }, []);

  const save = async (newState: AppState) => {
    setState(newState);
    try {
      // hasSeenIntro 포함 전체 저장.
      await AsyncStorage.setItem("mybrain_state", JSON.stringify(newState));
    } catch {}
  };

  const login = async (userId: string, clinicName: string) => {
    await save({ ...state, isAuthenticated: true, userId, clinicName });
  };

  const logout = async () => {
    await save({ ...defaultState });
  };

  const completeQuest = async (quest: "quest1" | "quest2" | "quest3") => {
    const newState = { ...state, questsCompleted: { ...state.questsCompleted, [quest]: true } };
    await save(newState);
  };

  const setDoctorProfile = (profile: Partial<DoctorProfile>) => {
    const newState = { ...state, doctorProfile: { ...state.doctorProfile, ...profile } };
    setState(newState);
    AsyncStorage.setItem("mybrain_state", JSON.stringify(newState)).catch(() => {});
  };

  const setPeriod = (period: "today" | "week" | "month" | "quarter") => {
    setState((s) => ({ ...s, period }));
  };

  const toggleDarkMode = () => {
    const newState = { ...state, isDarkMode: !state.isDarkMode };
    save(newState);
  };

  const markIntroSeen = async () => {
    await save({ ...state, hasSeenIntro: true });
  };

  const allQuestsCompleted =
    state.questsCompleted.quest1 && state.questsCompleted.quest2 && state.questsCompleted.quest3;

  return (
    <AppContext.Provider
      value={{ ...state, isLoaded, login, logout, completeQuest, setDoctorProfile, setPeriod, toggleDarkMode, markIntroSeen, allQuestsCompleted }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
