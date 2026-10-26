import Simulator from '../sections/Simulator'

export default function Home() {
  return (
    <div className="min-h-svh bg-brand-50 text-foreground">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-7">
          <img
            src="brand/milize_tate_white_web.png"
            alt="MILIZE"
            className="h-14 w-auto"
          />
          <div className="h-10 w-px bg-white/25" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-brand-gold-light">
              INHERITANCE TAX SIMULATOR
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
              相続税シミュレータ
            </h1>
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-gold" aria-hidden="true" />
      </header>

      <section className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="max-w-3xl text-sm leading-7 text-brand-800">
            遺産総額と相続人の構成から、日本の相続税を概算します。
            一次相続だけでなく、配偶者の取得割合を変えながら二次相続まで含めた合計税額を比較し、
            税負担が最小になる分割方針を視覚的に検討できます。
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Simulator />
      </main>

      <footer className="mt-4 border-t border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
          <img src="brand/milize_tate_black_web.png" alt="MILIZE" className="h-8 w-auto opacity-80" />
          <div className="space-y-2 text-xs leading-6 text-muted-foreground">
            <p>
              本シミュレータは概算です。基礎控除（3,000万円＋600万円×法定相続人数）・税率（10%〜55%の超過累進）・
              配偶者の税額軽減（1億6,000万円または法定相続分相当額まで非課税）・兄弟姉妹の2割加算を反映しています（2025年時点の制度）。
            </p>
            <p>
              二次相続モードでは、一次相続で配偶者が取得した財産と固有財産の合計を二次の遺産とし、相続人は子のみと仮定します。
              実際の税額は財産評価・債務・葬式費用・未成年/障害者控除・小規模宅地等の特例・分割方法などで変動します。
              申告・納税は税理士や税務署にご確認ください。
            </p>
            <p className="pt-2 text-brand-400">© MILIZE — Inheritance Tax Simulator</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
