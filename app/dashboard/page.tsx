import { getAuthUser } from "@/lib/auth";
import { applyDelay, shouldSimulateError, getSettings, isKvAvailable } from "@/lib/store";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await applyDelay();

  const { simulate, code } = await shouldSimulateError();
  if (simulate) {
    // エラーシミュレーション: HTTPエラーを返すためにカスタムレスポンスを使用
    // (Server Component では throw を使う)
    throw new Error(`SIMULATED_HTTP_ERROR:${code}`);
  }

  const user = await getAuthUser();
  const settings = await getSettings();
  const kvAvailable = await isKvAvailable();

  const features = [
    {
      id: "page-a",
      label: "機能 A",
      description: "ユーザー管理・一覧表示のサンプル画面",
      color: "blue",
      testId: "feature-a-button",
    },
    {
      id: "page-b",
      label: "機能 B",
      description: "データ集計・レポートのサンプル画面",
      color: "green",
      testId: "feature-b-button",
    },
    {
      id: "page-c",
      label: "機能 C",
      description: "設定・コンフィグのサンプル画面",
      color: "purple",
      testId: "feature-c-button",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
    green: "bg-green-50 border-green-200 hover:bg-green-100 text-green-700",
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
  };

  return (
    <div data-testid="dashboard-page">
      <NavBar username={user?.username ?? ""} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800" data-testid="dashboard-heading">
            ダッシュボード
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            ようこそ、<strong>{user?.username}</strong> さん
          </p>
        </div>

        {/* KV 未設定の警告 */}
        {!kvAvailable && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            <strong>注意:</strong> Vercel KV が未設定です。レスポンスタイム・エラー設定はサーバー再起動でリセットされます。
            永続化するには <code>.env.local</code> に KV の環境変数を追加してください。
          </div>
        )}

        {/* 現在の監視設定ステータス */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">現在の監視設定</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">レスポンス遅延</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {settings.delay_ms === 0 ? "なし" : `${settings.delay_ms} ms`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">エラーシミュレーション</span>
              <p className={`font-medium mt-0.5 ${settings.error_enabled ? "text-red-600" : "text-gray-800"}`}>
                {settings.error_enabled
                  ? `有効 (${settings.error_rate}% / HTTP ${settings.error_code})`
                  : "無効"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">ログインユーザー</span>
              <p className="font-medium text-gray-800 mt-0.5">{settings.username}</p>
            </div>
          </div>
        </div>

        {/* 機能ボタン */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link
              key={f.id}
              href={`/features/${f.id}`}
              data-testid={f.testId}
              className={`border rounded-lg p-6 transition-colors ${colorMap[f.color]}`}
            >
              <h2 className="text-lg font-semibold mb-2">{f.label}</h2>
              <p className="text-sm opacity-80">{f.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
