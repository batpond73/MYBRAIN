import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";

// 라인 차트 + 벤치마크 라인 오버레이. 노쇼/당일 취소/순이익률에서
// 공통 사용. 값이 벤치마크 아래(higherIsBetter=false → 값이 벤치마크
// 위로) 갈수록 위기 색.
type Point = { label: string; rate: number };
type Props = {
  data: Point[];
  color: string;              // 라인 컬러
  benchmark?: number;         // 옵션: 기준선
  benchmarkLabel?: string;    // 옵션: 기준선 라벨
  width: number;              // 컨테이너 폭
  height?: number;            // 차트 높이
  yMax?: number;              // 옵션: y 상한 (미지정 시 자동)
  yMin?: number;
};

export function AxisTrendLine({
  data,
  color,
  benchmark,
  benchmarkLabel,
  width,
  height = 90,
  yMax,
  yMin = 0,
}: Props) {
  if (data.length < 2) {
    return (
      <View style={{ height }}>
        <Text style={styles.empty}>표본 부족</Text>
      </View>
    );
  }
  const values = data.map((d) => d.rate);
  const maxV = yMax ?? Math.max(...values, benchmark ?? 0) * 1.1;
  const minV = yMin;
  const range = Math.max(maxV - minV, 1);
  const chartH = height;
  const chartW = width;

  const xAt = (i: number) => (i / (data.length - 1)) * chartW;
  const yAt = (v: number) => chartH - ((v - minV) / range) * chartH;

  const points = data.map((d, i) => ({ x: xAt(i), y: yAt(d.rate) }));
  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`),
    ""
  );

  const benchY = benchmark !== undefined ? yAt(benchmark) : null;

  return (
    <View style={{ width: chartW }}>
      <Svg
        width={chartW}
        height={chartH + 20}
        viewBox={`0 0 ${chartW} ${chartH + 20}`}
        style={{ width: chartW, height: chartH + 20 }}
      >
        {benchY !== null && (
          <>
            <Line
              x1={0}
              y1={benchY}
              x2={chartW}
              y2={benchY}
              stroke="#94A3B8"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            {benchmarkLabel && (
              <SvgText x={chartW - 4} y={benchY - 3} fontSize={9} fill="#94A3B8" textAnchor="end">
                {benchmarkLabel}
              </SvgText>
            )}
          </>
        )}
        <Path d={pathD} stroke={color} strokeWidth={2} fill="none" />
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Rect x={p.x - 3} y={p.y - 3} width={6} height={6} rx={3} fill={color} />
            <SvgText x={p.x} y={chartH + 14} fontSize={9} fill="#94A3B8" textAnchor="middle">
              {data[i].label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 11, color: "#94A3B8", textAlign: "center" as const },
});
