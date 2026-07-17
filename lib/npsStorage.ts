/**
 * npsStorage.ts — NPS 설문 응답 로컬 저장 · 조회 · CSV 교환.
 *
 * 현재는 AsyncStorage 기반 (기기 단위 저장). 즉 태블릿에 저장된
 * 응답과 원장 폰의 응답은 별개 스토리지에 있다. 두 기기를 잇는
 * 실시간 반영은 백엔드가 필요하며, 그 훅 지점을 saveResponse /
 * loadResponses 함수에 표시해뒀다 — 나중에 Supabase/Firebase를
 * 붙일 때 여기만 갈아끼우면 UI는 그대로 동작한다.
 *
 * 폴백 경로: 태블릿에서 CSV로 내보내기 → 원장 앱에서 파일로
 * 불러오기 → 로컬 스토리지에 병합. 완전 오프라인·백엔드 없이도
 * 실제 병원 시연이 가능.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type NpsCategory = "promoter" | "passive" | "detractor";

export type NpsResponse = {
  id: string;                              // 로컬 유니크 (timestamp + rand)
  createdAt: string;                       // ISO
  score: number;                           // 0-10
  category: NpsCategory;
  reason: string;
  sub: {
    booking: number | null;
    wait: number | null;
    explain: number | null;
    kindness: number | null;
  };
  source: "tablet" | "director-demo";      // 어디서 왔는지 태깅
};

const KEY = "mybrain_nps_responses_v1";

export function categoryOf(score: number): NpsCategory {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

// ── 저장 / 조회 ─────────────────────────────────────
// TODO(backend): 이 두 함수를 Supabase/Firebase 클라이언트로
// 갈아끼우면 실시간 반영이 즉시 켜진다. 반환 타입만 유지하면 UI는
// 그대로 동작.
export async function saveResponse(input: Omit<NpsResponse, "id" | "createdAt">): Promise<NpsResponse> {
  const existing = await loadResponses();
  const entry: NpsResponse = {
    ...input,
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...existing];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return entry;
}

export async function loadResponses(): Promise<NpsResponse[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export async function clearResponses(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// ── 집계 ────────────────────────────────────────────
// NPS = %Promoter - %Detractor. Passive는 0점 처리.
export type NpsSummary = {
  count: number;
  promoter: number;
  passive: number;
  detractor: number;
  nps: number;                    // -100 ~ +100
  averageScore: number;           // 0 ~ 10
  averageSub: { booking: number; wait: number; explain: number; kindness: number };
};

export function summarize(responses: NpsResponse[]): NpsSummary {
  if (responses.length === 0) {
    return {
      count: 0,
      promoter: 0, passive: 0, detractor: 0,
      nps: 0,
      averageScore: 0,
      averageSub: { booking: 0, wait: 0, explain: 0, kindness: 0 },
    };
  }
  let p = 0, ps = 0, d = 0, scoreSum = 0;
  const subSum = { booking: 0, wait: 0, explain: 0, kindness: 0 };
  const subCnt = { booking: 0, wait: 0, explain: 0, kindness: 0 };
  for (const r of responses) {
    if (r.category === "promoter") p++;
    else if (r.category === "passive") ps++;
    else d++;
    scoreSum += r.score;
    for (const k of ["booking", "wait", "explain", "kindness"] as const) {
      const v = r.sub[k];
      if (typeof v === "number") {
        subSum[k] += v;
        subCnt[k] += 1;
      }
    }
  }
  const count = responses.length;
  const nps = Math.round(((p - d) / count) * 100);
  const avgSub = {
    booking:  subCnt.booking  > 0 ? +(subSum.booking  / subCnt.booking ).toFixed(1) : 0,
    wait:     subCnt.wait     > 0 ? +(subSum.wait     / subCnt.wait    ).toFixed(1) : 0,
    explain:  subCnt.explain  > 0 ? +(subSum.explain  / subCnt.explain ).toFixed(1) : 0,
    kindness: subCnt.kindness > 0 ? +(subSum.kindness / subCnt.kindness).toFixed(1) : 0,
  };
  return {
    count,
    promoter: p, passive: ps, detractor: d,
    nps,
    averageScore: +(scoreSum / count).toFixed(1),
    averageSub: avgSub,
  };
}

// ── CSV 교환 ────────────────────────────────────────
const CSV_HEADER = [
  "id", "createdAt", "score", "category",
  "sub_booking", "sub_wait", "sub_explain", "sub_kindness",
  "source", "reason",
];

function escapeCsv(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function responsesToCsv(responses: NpsResponse[]): string {
  const rows = [CSV_HEADER.join(",")];
  for (const r of responses) {
    rows.push([
      r.id, r.createdAt, r.score, r.category,
      r.sub.booking, r.sub.wait, r.sub.explain, r.sub.kindness,
      r.source, r.reason,
    ].map(escapeCsv).join(","));
  }
  return rows.join("\n");
}

/**
 * 헤더가 있는 CSV 텍스트를 파싱해 NpsResponse[]로. 필드 순서가 달라도
 * 헤더 기준으로 매핑. 알 수 없는 값은 무시하고 최선으로 채운다.
 */
export function csvToResponses(csv: string): NpsResponse[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const out: NpsResponse[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const get = (col: string) => {
      const idx = header.indexOf(col);
      return idx >= 0 ? cells[idx] : undefined;
    };
    const scoreRaw = Number(get("score"));
    if (!Number.isFinite(scoreRaw)) continue;
    const numOrNull = (col: string): number | null => {
      const v = get(col);
      if (v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const category = (get("category") as NpsCategory) || categoryOf(scoreRaw);
    out.push({
      id: get("id") || `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      createdAt: get("createdAt") || new Date().toISOString(),
      score: scoreRaw,
      category,
      reason: get("reason") || "",
      sub: {
        booking:  numOrNull("sub_booking"),
        wait:     numOrNull("sub_wait"),
        explain:  numOrNull("sub_explain"),
        kindness: numOrNull("sub_kindness"),
      },
      source: (get("source") === "director-demo" ? "director-demo" : "tablet") as "tablet" | "director-demo",
    });
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === ",") { cells.push(cur); cur = ""; }
      else if (c === '"') { inQ = true; }
      else { cur += c; }
    }
  }
  cells.push(cur);
  return cells;
}

/**
 * import 시 기존 스토어와 병합. id 중복은 스킵.
 */
export async function importAndMerge(csv: string): Promise<{ added: number; skipped: number }> {
  const incoming = csvToResponses(csv);
  const existing = await loadResponses();
  const seen = new Set(existing.map((r) => r.id));
  let added = 0;
  let skipped = 0;
  for (const r of incoming) {
    if (seen.has(r.id)) { skipped++; continue; }
    existing.unshift(r);
    seen.add(r.id);
    added++;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));
  return { added, skipped };
}
