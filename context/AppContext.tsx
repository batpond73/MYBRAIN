import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface DoctorProfile {
  speedSlider: number;
  communicationSlider: number;
  chairSlider: number;
  managementType: "A" | "B" | null;
  // 사용자가 이 프로파일을 명시적으로 조작했는가 (근본 픽스).
  // 이전엔 "슬라이더 값이 0.5가 아니면 커스텀됨"으로 값 동등 판단 · 슬라이더를
  // 정확히 0.5로 되돌리거나 pan 중심이 우연히 0.5면 "맞춤 안 함"으로 오판했음.
  // 이제 setDoctorProfile이 호출될 때마다 true로 flip · defaultState에서는 false.
  isCustomized: boolean;
}

interface AppState {
  isAuthenticated: boolean;
  hasSeenIntro: boolean;
  userId: string;
  clinicName: string;
  clinicTenureYears: number;
  // isDemoMode: 실 EMR·재무 데이터 연동 이전 상태를 명시. 앱 전체가 mockData
  // 기반이므로 지금은 로그인 즉시 true. 향후 실 데이터 연동 시 false로 flip.
  // 대시보드 상단·설정 화면 등에서 "데모 데이터로 표시 중" 배지 노출 근거.
  isDemoMode: boolean;
  questsCompleted: { quest1: boolean; quest2: boolean; quest3: boolean };
  doctorProfile: DoctorProfile;
  period: "today" | "week" | "month" | "quarter";
  isDarkMode: boolean;
}

interface AppContextType extends AppState {
  isLoaded: boolean;
  // clinicName은 이제 optional · 명시 안 하면 기존 값 유지 (하드코딩 방지).
  login: (userId: string, clinicName?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeQuest: (quest: "quest1" | "quest2" | "quest3") => Promise<void>;
  setDoctorProfile: (profile: Partial<DoctorProfile>) => void;
  setClinicName: (name: string) => void;
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
  isDemoMode: true,     // 실 EMR 연동 이전엔 항상 true
  questsCompleted: { quest1: false, quest2: false, quest3: false },
  doctorProfile: { speedSlider: 0.5, communicationSlider: 0.5, chairSlider: 0.5, managementType: null, isCustomized: false },
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
  setClinicName: () => {},
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

  // 상태 변경 시 AsyncStorage에 자동 persist.
  // 초기 로드 이전엔 스킵해서 defaultState가 저장본을 덮어쓰지 않도록 함.
  //
  // 왜 useEffect 기반인가:
  // 이전엔 각 mutator가 closure의 `state`를 읽어 새 값 계산 + AsyncStorage
  // 직접 write 하는 방식이었음. 이 방식은 한 tick 안에서 mutator가 연속으로
  // 호출되면 두 번째가 첫 번째의 in-memory 업데이트를 못 보고 stale closure
  // 로 덮어써서 마지막 write가 첫 업데이트를 지웠음.
  //   예) quest/profile.tsx handleComplete에서
  //       setDoctorProfile({...managementType:"A"}) 직후
  //       await completeQuest("quest2")를 부르면
  //       completeQuest가 doctorProfile.managementType=null인 old state로
  //       AsyncStorage를 덮어써서 managementType이 사라짐
  // 근본 해결: 모든 mutator를 setState(prev => ...) 함수형으로 바꿔서
  // React가 순차적으로 compose하게 하고, persist는 최종 state 하나만
  // 저장하도록 useEffect로 단일화.
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem("mybrain_state", JSON.stringify(state)).catch(() => {});
  }, [state, isLoaded]);

  // clinicName 규약 (근본):
  //  - 명시적으로 넘긴 값이 있고 비어있지 않으면 그 값을 저장
  //  - 명시 안 하거나 빈 문자열이면 기존 clinicName 유지 (하드코딩 방지)
  //  - 이전엔 login.tsx가 "서울나눔치과의원" 하드코딩을 넘겨 어떤 원장님이
  //    로그인해도 대시보드에 특정 병원명이 표시되는 버그 있었음
  const login = async (userId: string, clinicName?: string) => {
    setState((s) => ({
      ...s,
      isAuthenticated: true,
      userId,
      clinicName: clinicName && clinicName.trim().length > 0 ? clinicName : s.clinicName,
    }));
  };

  const setClinicName = (name: string) => {
    setState((s) => ({ ...s, clinicName: name }));
  };

  const logout = async () => {
    setState(defaultState);
  };

  const completeQuest = async (quest: "quest1" | "quest2" | "quest3") => {
    setState((s) => ({ ...s, questsCompleted: { ...s.questsCompleted, [quest]: true } }));
  };

  const setDoctorProfile = (profile: Partial<DoctorProfile>) => {
    // setDoctorProfile 호출 = 사용자가 명시적으로 조작 · isCustomized 자동 true
    // (근본 · 값 동등 판단 오판 방지)
    setState((s) => ({
      ...s,
      doctorProfile: { ...s.doctorProfile, ...profile, isCustomized: true },
    }));
  };

  const setPeriod = (period: "today" | "week" | "month" | "quarter") => {
    setState((s) => ({ ...s, period }));
  };

  const toggleDarkMode = () => {
    setState((s) => ({ ...s, isDarkMode: !s.isDarkMode }));
  };

  const markIntroSeen = async () => {
    setState((s) => ({ ...s, hasSeenIntro: true }));
  };

  const allQuestsCompleted =
    state.questsCompleted.quest1 && state.questsCompleted.quest2 && state.questsCompleted.quest3;

  return (
    <AppContext.Provider
      value={{ ...state, isLoaded, login, logout, completeQuest, setDoctorProfile, setClinicName, setPeriod, toggleDarkMode, markIntroSeen, allQuestsCompleted }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
