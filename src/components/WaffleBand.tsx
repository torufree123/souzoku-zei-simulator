import { fmtMan } from '@/lib/tax'

interface WaffleBandProps {
  /** 遺産総額（円） */
  estate: number
  /** 基礎控除（円） */
  deduction: number
  /** 納付税額（円） */
  paid: number
  label?: string
  statLabel?: string
}

type Kind = 'deduction' | 'taxable' | 'tax'

const CELL_CLASS: Record<Kind, string> = {
  deduction: 'bg-neutral-200 dark:bg-neutral-700',
  taxable: 'bg-blue-300 dark:bg-blue-800',
  tax: 'bg-blue-600 dark:bg-blue-400',
}

/** 遺産100%を100セルで表す配分バンド（基礎控除 → 課税対象 → 税額相当） */
export function WaffleBand({ estate, deduction, paid, label, statLabel }: WaffleBandProps) {
  let dedCells = 100
  let taxCells = 0
  if (estate > 0) {
    dedCells = Math.round((100 * Math.min(estate, deduction)) / estate)
    taxCells = Math.round((100 * paid) / estate)
  }
  const taxableCells = 100 - dedCells
  if (taxCells > taxableCells) taxCells = taxableCells
  const plainTaxable = 100 - dedCells - taxCells

  const cells: Kind[] = Array.from({ length: 100 }, (_, i) => {
    if (i < dedCells) return 'deduction'
    if (i < dedCells + plainTaxable) return 'taxable'
    return 'tax'
  })

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>{label}</span>
          {statLabel && <span>{statLabel}</span>}
        </div>
      )}
      <div
        className="grid max-w-md grid-cols-[repeat(25,minmax(0,1fr))] gap-[3px]"
        role="img"
        aria-label={`遺産の内訳: 基礎控除${dedCells}%、課税対象${100 - dedCells}%、うち税額相当${taxCells}%`}
      >
        {cells.map((k, i) => (
          <span key={i} className={`aspect-square rounded-[2px] ${CELL_CLASS[k]}`} />
        ))}
      </div>
    </div>
  )
}

export function WaffleLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className={`inline-block h-2.5 w-2.5 rounded-[2px] ${CELL_CLASS.deduction}`} />
        基礎控除
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={`inline-block h-2.5 w-2.5 rounded-[2px] ${CELL_CLASS.taxable}`} />
        課税対象
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={`inline-block h-2.5 w-2.5 rounded-[2px] ${CELL_CLASS.tax}`} />
        税額相当
      </span>
    </div>
  )
}

export function waffleStat(estate: number): string {
  return fmtMan(estate / 10000)
}
