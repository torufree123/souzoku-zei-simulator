import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WaffleBand, WaffleLegend } from '@/components/WaffleBand'
import { SensitivityChart } from '@/components/SensitivityChart'
import {
  COMPOSITIONS,
  computeSingle,
  computeTwo,
  fmtMan,
  fmtShare,
  sensitivity,
  type CompKey,
} from '@/lib/tax'

type Mode = 'single' | 'two'

const ESTATE_PRESETS = [3000, 5000, 10000, 30000, 50000]

function clampNum(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(v)))
}

export default function Simulator() {
  const [mode, setMode] = useState<Mode>('two')
  const [estateMan, setEstateMan] = useState(8000)
  const [estateText, setEstateText] = useState('8000')
  const [comp, setComp] = useState<CompKey>('spouse_child')
  const [prevSingleComp, setPrevSingleComp] = useState<CompKey>('spouse_child')
  const [countByComp, setCountByComp] = useState<Record<CompKey, number>>({
    spouse_child: 2,
    spouse_only: 0,
    child_only: 2,
    spouse_parent: 2,
    spouse_sibling: 1,
  })
  const [sharePct, setSharePct] = useState(50)
  const [ownMan, setOwnMan] = useState(0)
  const [ownText, setOwnText] = useState('0')

  const two = mode === 'two'
  const count = two ? countByComp.spouse_child : countByComp[comp]
  const countMeta = two
    ? { countLabel: '子の人数', min: 1, max: 6 }
    : COMPOSITIONS[comp]

  const single = useMemo(
    () => (two ? null : computeSingle(estateMan, comp, count)),
    [two, estateMan, comp, count],
  )
  const result = useMemo(
    () => (two ? computeTwo(estateMan, count, sharePct, ownMan) : null),
    [two, estateMan, count, sharePct, ownMan],
  )
  const baseline = useMemo(
    () => (two ? computeTwo(estateMan, count, 50, ownMan) : null),
    [two, estateMan, count, ownMan],
  )
  const curve = useMemo(
    () => (two ? sensitivity(estateMan, count, ownMan) : []),
    [two, estateMan, count, ownMan],
  )

  const grand = two ? result!.grand : single!.grand
  const estate = two ? result!.estate : single!.estate
  const totalWealth = two ? estate + ownMan * 10000 : estate
  const effectiveRate = totalWealth > 0 ? (grand / totalWealth) * 100 : 0
  const diffMan = two && baseline ? (result!.grand - baseline.grand) / 10000 : 0

  function setEstate(man: number) {
    const v = clampNum(man, 0, 1_000_000)
    setEstateMan(v)
    setEstateText(String(v))
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    if (next === 'two') {
      setPrevSingleComp(comp)
    } else {
      setComp(prevSingleComp)
    }
    setMode(next)
  }

  function stepCount(delta: number) {
    const next = clampNum(count + delta, countMeta.min, countMeta.max)
    if (next === count) return
    const key = two ? 'spouse_child' : comp
    setCountByComp((prev) => ({ ...prev, [key]: next }))
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      {/* ---------- 条件入力 ---------- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">計算条件</CardTitle>
          <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="single" className="flex-1">一次相続のみ</TabsTrigger>
              <TabsTrigger value="two" className="flex-1">二次相続まで</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="estate-num">{two ? '一次相続の遺産総額' : '遺産総額'}</Label>
              <span className="flex items-center gap-1.5">
                <Input
                  id="estate-num"
                  type="number"
                  min={0}
                  step={100}
                  value={estateText}
                  onChange={(e) => {
                    setEstateText(e.target.value)
                    const v = Number(e.target.value)
                    if (e.target.value !== '' && !Number.isNaN(v)) setEstateMan(clampNum(v, 0, 1_000_000))
                  }}
                  onBlur={() => setEstateText(String(estateMan))}
                  className="h-8 w-28 text-right tabular-nums"
                />
                <span className="text-xs text-muted-foreground">万円</span>
              </span>
            </div>
            <Slider
              value={[Math.min(estateMan, 100000)]}
              min={0}
              max={100000}
              step={100}
              onValueChange={([v]) => setEstate(v)}
              aria-label="遺産総額スライダー（万円）"
            />
            <div className="flex flex-wrap gap-1.5">
              {ESTATE_PRESETS.map((p) => (
                <Button
                  key={p}
                  variant={estateMan === p ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-2.5 text-xs tabular-nums"
                  onClick={() => setEstate(p)}
                >
                  {fmtMan(p)}
                </Button>
              ))}
            </div>
          </div>

          {!two && (
            <div className="space-y-2">
              <Label htmlFor="comp-select">相続人の構成</Label>
              <Select
                value={comp}
                onValueChange={(v) => setComp(v as CompKey)}
              >
                <SelectTrigger id="comp-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMPOSITIONS) as CompKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {COMPOSITIONS[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {countMeta.max > 0 && (
            <div className="flex items-center justify-between gap-3">
              <Label>{countMeta.countLabel}</Label>
              <span className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={count <= countMeta.min}
                  onClick={() => stepCount(-1)}
                  aria-label="人数を減らす"
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm font-medium tabular-nums">{count}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={count >= countMeta.max}
                  onClick={() => stepCount(1)}
                  aria-label="人数を増やす"
                >
                  ＋
                </Button>
              </span>
            </div>
          )}

          {two && (
            <>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor="share-range">一次相続で配偶者が取得する割合</Label>
                  <span className="text-sm font-medium tabular-nums">{sharePct}%</span>
                </div>
                <Slider
                  id="share-range"
                  value={[sharePct]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setSharePct(v)}
                  aria-label="一次相続で配偶者が取得する割合"
                />
                <p className="text-xs text-muted-foreground">
                  法定相続分は 50%。配偶者の取得分がそのまま二次相続の課税対象になります。
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="own-num">配偶者固有の財産</Label>
                <span className="flex items-center gap-1.5">
                  <Input
                    id="own-num"
                    type="number"
                    min={0}
                    step={100}
                    value={ownText}
                    onChange={(e) => {
                      setOwnText(e.target.value)
                      const v = Number(e.target.value)
                      if (e.target.value !== '' && !Number.isNaN(v)) setOwnMan(clampNum(v, 0, 1_000_000))
                    }}
                    onBlur={() => setOwnText(String(ownMan))}
                    className="h-8 w-28 text-right tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">万円</span>
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------- 結果 ---------- */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {two ? '納付税額の合計（一次＋二次・概算）' : '納付税額の合計（概算）'}
              </p>
              {grand > 0 ? (
                <Badge variant="secondary">課税対象あり</Badge>
              ) : (
                <Badge variant="outline">基礎控除内のため課税なし</Badge>
              )}
            </div>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
              {fmtMan(grand / 10000)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground tabular-nums">
              {two && result ? (
                <>
                  一次 {fmtMan(result.paid1 / 10000)} ・ 二次 {fmtMan(result.paid2 / 10000)} ・
                  実効税率 {effectiveRate.toFixed(1)}%
                </>
              ) : (
                <>実効税率 {effectiveRate.toFixed(1)}% ・ 法定相続分どおりに取得した場合</>
              )}
            </p>
            {two && (
              <p className="mt-1 text-sm tabular-nums">
                {Math.round(diffMan) === 0 ? (
                  <span className="text-muted-foreground">法定相続分（配偶者50%）ケースと同額です</span>
                ) : diffMan < 0 ? (
                  <>
                    法定相続分（配偶者50%）ケースより
                    <span className="font-semibold text-blue-600 dark:text-blue-400"> {fmtMan(-diffMan)} 少ない</span>
                    計算です
                  </>
                ) : (
                  <>
                    法定相続分（配偶者50%）ケースより
                    <span className="font-semibold"> {fmtMan(diffMan)} 多い</span>
                    計算です
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{two ? '基礎控除（一次）' : '基礎控除（3,000万＋600万×人数）'}</p>
              <p className="mt-1 text-lg font-medium tabular-nums">
                {fmtMan((two ? result!.d1 : single!.deduction) / 10000)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{two ? '課税遺産総額（一次）' : '課税遺産総額'}</p>
              <p className="mt-1 text-lg font-medium tabular-nums">
                {fmtMan((two ? result!.t1 : single!.taxableTotal) / 10000)}
              </p>
            </div>
            {two && result && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">二次相続の遺産総額</p>
                  <p className="mt-1 text-lg font-medium tabular-nums">{fmtMan(result.e2 / 10000)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">課税遺産総額（二次）</p>
                  <p className="mt-1 text-lg font-medium tabular-nums">{fmtMan(result.t2 / 10000)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {two && result ? (
              <>
                <WaffleBand
                  estate={result.estate}
                  deduction={result.d1}
                  paid={result.paid1}
                  label="一次相続の遺産"
                  statLabel={fmtMan(result.estate / 10000)}
                />
                <WaffleBand
                  estate={result.e2}
                  deduction={result.d2}
                  paid={result.paid2}
                  label="二次相続の遺産（配偶者の取得分＋固有財産）"
                  statLabel={fmtMan(result.e2 / 10000)}
                />
              </>
            ) : (
              single && (
                <WaffleBand estate={single.estate} deduction={single.deduction} paid={single.grand} />
              )
            )}
            <WaffleLegend />
          </CardContent>
        </Card>

        {two && (
          <Card>
            <CardContent className="pt-6">
              <SensitivityChart data={curve} currentPct={sharePct} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">相続人ごとの内訳（算出税額ベース）</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>続柄</TableHead>
                  <TableHead className="text-right">{two ? '取得割合' : '相続分'}</TableHead>
                  <TableHead className="text-right">取得額</TableHead>
                  <TableHead className="text-right">納付税額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {two && result ? (
                  <>
                    <TableRow>
                      <TableCell colSpan={4} className="pt-4 text-xs font-medium text-muted-foreground">
                        一次相続
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        配偶者
                        <span className="block text-xs text-muted-foreground">
                          {result.spOverCap ? '軽減上限を超過' : '配偶者の税額軽減'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{sharePct}%</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMan(result.spRecv / 10000)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {result.spPaid > 0 ? fmtMan(result.spPaid / 10000) : '0円'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{count > 1 ? `子 ${count}人（各人）` : '子'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtShare(((100 - sharePct) / 100) * (1 / count))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMan(result.childRecvEach / 10000)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {result.childPaidEach > 0 ? fmtMan(result.childPaidEach / 10000) : '0円'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} className="pt-4 text-xs font-medium text-muted-foreground">
                        二次相続（配偶者の遺産）
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{count > 1 ? `子 ${count}人（各人）` : '子'}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtShare(1 / count)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMan(result.child2Each / 10000)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {result.child2PaidEach > 0 ? fmtMan(result.child2PaidEach / 10000) : '0円'}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  single?.rows.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>
                        {r.label}
                        {r.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.shareTxt}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMan(r.receivedMan)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.paidMan > 0 ? fmtMan(r.paidMan) : '0円'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>合計</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">
                    {two ? '―' : fmtMan(single!.taxableTotal / 10000)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMan(grand / 10000)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
