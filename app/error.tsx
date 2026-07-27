"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // エラーシミュレーション時のコードを取得
  const match = error.message?.match(/SIMULATED_HTTP_ERROR:(\d+)/);
  const simulatedCode = match ? parseInt(match[1]) : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      data-testid="error-page"
    >
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-red-500 mb-4">
          {simulatedCode ?? 500}
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {simulatedCode ? "エラーシミュレーション中" : "エラーが発生しました"}
        </h1>
        <p className="text-gray-500 text-sm mb-2" data-testid="error-message">
          {simulatedCode
            ? `HTTP ${simulatedCode} エラーをシミュレーション中です。設定画面でエラーシミュレーションをオフにしてください。`
            : "予期しないエラーが発生しました。しばらく待ってから再試行してください。"}
        </p>
        {/* Grafana コンテンツチェック用マーカー */}
        <span
          data-testid="simulated-error-marker"
          style={{ display: "none" }}
        >
          {simulatedCode ? `SIMULATED_ERROR_${simulatedCode}` : "UNEXPECTED_ERROR"}
        </span>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
          >
            再試行
          </button>
          <Link
            href="/settings"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md"
          >
            設定へ
          </Link>
        </div>
      </div>
    </div>
  );
}
