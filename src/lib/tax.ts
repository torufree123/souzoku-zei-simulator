// 日本の相続税 計算ロジック（2025年時点の税率・基礎控除に基づく概算）

export type CompKey =
  | 'spouse_child'
  | 'spouse_only'
  | 'child_only'
  | 'spouse_parent'
  | 'spouse_sibling'

export interface CompMeta {
  label: string
  countLabel: string
  min: number
  max: number
}

export const COMPOSITIONS: Record<CompKey, CompMeta> = {
  spouse_child: { label: '配偶者と子', countLabel: '子の人数', min: 1, max: 6 },
  spouse_only: { label: '配偶者のみ', countLabel: '', min: 0, max: 0 },
  child_only: { label: '子のみ', countLabel: '子の人数', min: 1, max: 6 },
  spouse_parent: { label: '配偶者と父母', countLabel: '父母の人数', min: 1, max: 2 },
  spouse_sibling: { label: '配偶者と兄弟姉妹', countLabel: '兄弟姉妹の人数', min: 1, max: 4 },
}

export interface Heir {
  label: string
  share: number
  spouse: boolean
  surcharge: boolean
}

const BRACKETS: Array<[number, number, number]> = [
  [10_000_000, 0.1, 0],
  [30_000_000, 0.15, 500_000],
  [50_000_000, 0.2, 2_000_000],
  [100_000_000, 0.3, 7_000_000],
  [200_000_000, 0.4, 17_000_000],
  [300_000_000, 0.45, 27_000_000],
  [600_000_000, 0.5, 42_000_000],
  [Number.POSITIVE_INFINITY, 0.55, 72_000_000],
]

/** 法定相続分に応じた各人の算出税額（速算表） */
export function taxOn(amount: number): number {
  if (amount <= 0) return 0
  for (const [lim, rate, ded] of BRACKETS) {
    if (amount <= lim) return amount * rate - ded
  }
  return 0
}

export function heirsFor(comp: CompKey, n: number): Heir[] {
  const heirs: Heir[] = []
  if (comp === 'spouse_only') {
    heirs.push({ label: '配偶者', share: 1, spouse: true, surcharge: false })
  } else if (comp === 'spouse_child') {
    heirs.push({ label: '配偶者', share: 1 / 2, spouse: true, surcharge: false })
    for (let i = 0; i < n; i++)
      heirs.push({ label: n > 1 ? `子${i + 1}` : '子', share: 1 / (2 * n), spouse: false, surcharge: false })
  } else if (comp === 'child_only') {
    for (let i = 0; i < n; i++)
      heirs.push({ label: n > 1 ? `子${i + 1}` : '子', share: 1 / n, spouse: false, surcharge: false })
  } else if (comp === 'spouse_parent') {
    heirs.push({ label: '配偶者', share: 2 / 3, spouse: true, surcharge: false })
    const plabels = ['父', '母']
    for (let i = 0; i < n; i++)
      heirs.push({ label: plabels[i] ?? `直系尊属${i + 1}`, share: 1 / (3 * n), spouse: false, surcharge: false })
  } else if (comp === 'spouse_sibling') {
    heirs.push({ label: '配偶者', share: 3 / 4, spouse: true, surcharge: false })
    for (let i = 0; i < n; i++)
      heirs.push({ label: n > 1 ? `兄弟姉妹${i + 1}` : '兄弟姉妹', share: 1 / (4 * n), spouse: false, surcharge: true })
  }
  return heirs
}

// ---------- 表示フォーマット（万円単位） ----------

export function fmtMan(man: number): string {
  const v = Math.round(man)
  if (v >= 10000) {
    const oku = Math.floor(v / 10000)
    const rem = v - oku * 10000
    return rem ? `${oku}億${rem.toLocaleString('ja-JP')}万円` : `${oku}億円`
  }
  return `${v.toLocaleString('ja-JP')}万円`
}

export function fmtShare(s: number): string {
  const near = (x: number) => Math.abs(s - x) < 1e-9
  if (near(1)) return '全部'
  if (near(1 / 2)) return '1/2'
  if (near(1 / 3)) return '1/3'
  if (near(2 / 3)) return '2/3'
  if (near(1 / 4)) return '1/4'
  if (near(3 / 4)) return '3/4'
  return `${Math.round(s * 1000) / 10}%`
}

// ---------- 一次相続のみ ----------

export interface SingleRow {
  label: string
  shareTxt: string
  receivedMan: number
  paidMan: number
  note: string
}

export interface SingleResult {
  estate: number // 円
  deduction: number // 円
  taxableTotal: number // 円
  grand: number // 円
  rows: SingleRow[]
}

export function computeSingle(estateMan: number, comp: CompKey, count: number): SingleResult {
  const estate = estateMan * 10000
  const heirs = heirsFor(comp, count)
  const deduction = 30_000_000 + 6_000_000 * heirs.length
  const taxableTotal = Math.max(0, estate - deduction)

  let totalTax = 0
  const calc = heirs.map((h) => {
    const received = taxableTotal * h.share
    totalTax += taxOn(received)
    return { h, received }
  })

  let grand = 0
  const rows: SingleRow[] = calc.map(({ h, received }) => {
    const allocated = totalTax * h.share
    let paid = 0
    let note = ''
    if (h.spouse) {
      note = '配偶者の税額軽減'
    } else {
      paid = allocated * (h.surcharge ? 1.2 : 1)
      if (h.surcharge) note = '2割加算'
    }
    grand += paid
    return {
      label: h.label,
      shareTxt: fmtShare(h.share),
      receivedMan: received / 10000,
      paidMan: paid / 10000,
      note,
    }
  })

  return { estate, deduction, taxableTotal, grand, rows }
}

// ---------- 一次＋二次相続 ----------

export interface TwoResult {
  estate: number
  d1: number
  t1: number
  spRecv: number
  spPaid: number
  spOverCap: boolean
  childRecvEach: number
  childPaidEach: number
  paid1: number
  e2: number
  d2: number
  t2: number
  paid2: number
  child2Each: number
  child2PaidEach: number
  grand: number
}

export function computeTwo(estateMan: number, n: number, sharePct: number, ownMan: number): TwoResult {
  const E = estateMan * 10000
  const s = sharePct / 100
  const d1 = 30_000_000 + 6_000_000 * (n + 1)
  const t1 = Math.max(0, E - d1)
  const totalTax1 = taxOn(t1 / 2) + n * taxOn(t1 / (2 * n))

  const spRecv = E * s
  // 配偶者の税額軽減の上限: 1億6,000万円 or 課税価格の合計×法定相続分(1/2)
  const cap = Math.max(160_000_000, E * 0.5)
  const spPaid = E > 0 ? (totalTax1 / E) * Math.max(0, spRecv - cap) : 0
  const childPaidTotal = totalTax1 * (1 - s)
  const paid1 = spPaid + childPaidTotal

  const e2 = spRecv - spPaid + ownMan * 10000
  const d2 = 30_000_000 + 6_000_000 * n
  const t2 = Math.max(0, e2 - d2)
  const paid2 = n * taxOn(t2 / n)

  return {
    estate: E,
    d1,
    t1,
    spRecv,
    spPaid,
    spOverCap: spPaid > 0,
    childRecvEach: (E * (1 - s)) / n,
    childPaidEach: n > 0 ? childPaidTotal / n : 0,
    paid1,
    e2,
    d2,
    t2,
    paid2,
    child2Each: e2 / n,
    child2PaidEach: n > 0 ? paid2 / n : 0,
    grand: paid1 + paid2,
  }
}

/** 配偶者の取得割合 0〜100% に対する合計税額の感応度（万円） */
export function sensitivity(
  estateMan: number,
  n: number,
  ownMan: number,
): Array<{ pct: number; grandMan: number }> {
  const out: Array<{ pct: number; grandMan: number }> = []
  for (let pct = 0; pct <= 100; pct += 5) {
    out.push({ pct, grandMan: computeTwo(estateMan, n, pct, ownMan).grand / 10000 })
  }
  return out
}
