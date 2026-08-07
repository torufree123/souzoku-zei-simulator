import Simulator from '../sections/Simulator'

export default function Home() {
  return (
    <div className="min-h-svh bg-neutral-50 text-foreground dark:bg-background">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">相続税シミュレータ</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            遺産総額と相続人の構成から、日本の相続税を概算します。
            一次相続だけでなく、配偶者の取得割合を変えながら二次相続まで含めた合計税額を比較できます。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Simulator />
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs leading-5 text-muted-foreground">
          <p>
            本シミュレータは概算です。基礎控除（3,000万円＋600万円×法定相続人数）・税率（10%〜55%の超過累進）・
            配偶者の税額軽減（1億6,000万円または法定相続分相当額まで非課税）・兄弟姉妹の2割加算を反映しています（2025年時点の制度）。
          </p>
          <p>
            二次相続モードでは、一次相続で配偶者が取得した財産と固有財産の合計を二次の遺産とし、相続人は子のみと仮定します。
            実際の税額は財産評価・債務・葬式費用・未成年/障害者控除・小規模宅地等の特例・分割方法などで変動します。
            申告・納税は税理士や税務署にご確認ください。
          </p>
        </div>
      </footer>
    </div>
  )
}
