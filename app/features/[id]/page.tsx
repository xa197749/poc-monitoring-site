import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { applyDelay, shouldSimulateError } from "@/lib/store";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Grafana コンテンツチェック用の一意な識別子
const FEATURE_CONTENT: Record<string, {
  title: string;
  description: string;
  marker: string;
  items: string[];
}> = {
  "page-a": {
    title: "機能 A — ユーザー管理",
    description: "ユーザーの一覧・登録・削除を行う画面のサンプルです。",
    marker: "CONTENT_MARKER_FEATURE_A_OK",
    items: ["田中 太郎 (tanaka@example.com)", "鈴木 花子 (suzuki@example.com)", "佐藤 一郎 (sato@example.com)"],
  },
  "page-b": {
    title: "機能 B — レポート",
    description: "データ集計・レポート出力を行う画面のサンプルです。",
    marker: "CONTENT_MARKER_FEATURE_B_OK",
    items: ["月次売上レポート (2026-06)", "週次アクセス集計 (W30)", "エラーログサマリー (2026-07)"],
  },
  "page-c": {
    title: "機能 C — システム設定",
    description: "システム設定・環境変数の確認を行う画面のサンプルです。",
    marker: "CONTENT_MARKER_FEATURE_C_OK",
    items: ["メール通知: 有効", "API レート制限: 1000 req/min", "メンテナンスモード: 無効"],
  },
};

export default async function FeaturePage({
  params,
}: {
  params: { id: string };
}) {
  const content = FEATURE_CONTENT[params.id];
  if (!content) notFound();

  await applyDelay();

  const { simulate, code } = await shouldSimulateError();
  if (simulate) {
    throw new Error(`SIMULATED_HTTP_ERROR:${code}`);
  }

  const user = await getAuthUser();

  const otherPages = Object.entries(FEATURE_CONTENT)
    .filter(([id]) => id !== params.id)
    .map(([id, c]) => ({ id, title: c.title }));

  return (
    <div data-testid={`feature-${params.id}-page`}>
      <NavBar username={user?.username ?? ""} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
            data-testid="back-to-dashboard"
          >
            ← ダッシュボードへ戻る
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2" data-testid="feature-heading">
          {content.title}
        </h1>
        <p className="text-gray-500 text-sm mb-8">{content.description}</p>

        {/* コンテンツ検証用マーカー (非表示) */}
        <span data-testid="content-marker" style={{ display: "none" }}>
          {content.marker}
        </span>

        {/* コンテンツリスト */}
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {content.items.map((item, i) => (
            <div
              key={i}
              className="px-5 py-4 text-sm text-gray-700 flex items-center justify-between"
              data-testid={`list-item-${i}`}
            >
              <span>{item}</span>
              <span className="text-xs text-gray-400">ID: {params.id.toUpperCase()}-{String(i + 1).padStart(3, "0")}</span>
            </div>
          ))}
        </div>

        {/* 他ページへの遷移ボタン */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">他の機能ページ</h2>
          <div className="flex gap-3">
            {otherPages.map((p) => (
              <Link
                key={p.id}
                href={`/features/${p.id}`}
                data-testid={`nav-to-${p.id}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-md transition-colors"
              >
                {p.title.split("—")[0].trim()}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
