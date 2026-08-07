import { fmtMan } from '@/lib/tax'

interface SensitivityChartProps {
  data: Array<{ pct: number; grandMan: number }>
  currentPct: number
}

const W = 560
const H = 200
const PAD_L = 8
const PAD_R = 8
const PAD_T = 24
const PAD_B = 28

/** 配偶者の取得割合（横軸）と一次＋二次の合計税額（縦軸）の感応度チャート */
export function SensitivityChart({ data, currentPct }: SensitivityChartProps) {
  if (data.length === 0) return null

  const values = data.map((d) => d.grandMan)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const x = (pct: number) => PAD_L + (pct / 100) * (W - PAD_L - PAD_R)
  const y = (v: number) => PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B)

  const points = data.map((d) => `${x(d.pct)},${y(d.grandMan)}`).join(' ')
  const current = data.reduce((a, b) =>
    Math.abs(b.pct - currentPct) < Math.abs(a.pct - currentPct) ? b : a,
  )
  const minPoint = data.reduce((a, b) => (b.grandMan < a.grandMan ? b : a))
  const flat = max - min < 1 // ほぼ課税なし

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-muted-foreground">配偶者の取得割合と合計税額（一次＋二次）</p>
        {!flat && (
          <p className="text-xs tabular-nums text-muted-foreground">
            最小: <span className="font-medium text-foreground">{fmtMan(minPoint.grandMan)}</span>
            （配偶者 {minPoint.pct}%）
          </p>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" role="img"
        aria-label={`配偶者の取得割合に対する合計税額の推移。最小は配偶者${minPoint.pct}%で${fmtMan(minPoint.grandMan)}`}>
        {/* グリッド線 */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={PAD_T + t * (H - PAD_T - PAD_B)}
            y2={PAD_T + t * (H - PAD_T - PAD_B)}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        ))}
        {/* 軸ラベル */}
        <text x={PAD_L} y={H - 8} className="fill-muted-foreground" fontSize={11}>0%</text>
        <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>50%</text>
        <text x={W - PAD_R} y={H - 8} textAnchor="end" className="fill-muted-foreground" fontSize={11}>100%</text>
        <text x={PAD_L} y={PAD_T - 10} className="fill-muted-foreground" fontSize={11}>
          最大 {fmtMan(max)}
        </text>
        <text x={W - PAD_R} y={PAD_T - 10} textAnchor="end" className="fill-muted-foreground" fontSize={11}>
          最小 {fmtMan(min)}
        </text>
        {/* 折れ線 */}
        <polyline points={points} fill="none" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth={2} strokeLinejoin="round" />
        {/* 最小点 */}
        {!flat && (
          <g>
            <circle cx={x(minPoint.pct)} cy={y(minPoint.grandMan)} r={4} className="fill-background stroke-blue-600 dark:stroke-blue-400" strokeWidth={2} />
            <text
              x={x(minPoint.pct)}
              y={y(minPoint.grandMan) - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              最小
            </text>
          </g>
        )}
        {/* 現在値 */}
        <line
          x1={x(current.pct)}
          x2={x(current.pct)}
          y1={PAD_T}
          y2={H - PAD_B}
          className="stroke-foreground"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <circle cx={x(current.pct)} cy={y(current.grandMan)} r={5} className="fill-blue-600 dark:fill-blue-400" />
        <text
          x={Math.min(Math.max(x(current.pct), 60), W - 60)}
          y={y(current.grandMan) - 12}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          {fmtMan(current.grandMan)}
        </text>
      </svg>
    </div>
  )
}
