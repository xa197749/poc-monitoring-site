"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";

type SettingsData = {
  delay_ms: number;
  error_enabled: boolean;
  error_rate: number;
  error_code: number;
  username: string;
  kv_available: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 認証情報変更フォーム
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 監視設定フォーム
  const [delayMs, setDelayMs] = useState(0);
  const [errorEnabled, setErrorEnabled] = useState(false);
  const [errorRate, setErrorRate] = useState(0);
  const [errorCode, setErrorCode] = useState(500);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        setSettings(data);
        setDelayMs(data.delay_ms);
        setErrorEnabled(data.error_enabled);
        setErrorRate(data.error_rate);
        setErrorCode(data.error_code);
        setNewUsername(data.username);
      })
      .finally(() => setLoading(false));
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function saveMonitoringSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delay_ms: delayMs,
          error_enabled: errorEnabled,
          error_rate: errorRate,
          error_code: errorCode,
        }),
      });
      if (res.ok) {
        showMessage("success", "監視設定を保存しました");
      } else {
        showMessage("error", "保存に失敗しました");
      }
    } catch {
      showMessage("error", "通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showMessage("error", "新しいパスワードが一致しません");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          change_credentials: true,
          current_password: currentPassword,
          new_username: newUsername,
          new_password: newPassword || undefined,
        }),
      });
      if (res.ok) {
        showMessage("success", "認証情報を更新しました");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        showMessage("error", data.message ?? "更新に失敗しました");
      }
    } catch {
      showMessage("error", "通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div data-testid="settings-page">
        <NavBar username="" />
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  const ERROR_CODES = [400, 401, 403, 404, 500, 502, 503, 504];

  return (
    <div data-testid="settings-page">
      <NavBar username={settings?.username ?? ""} />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>

        {/* メッセージ */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
            data-testid="settings-message"
          >
            {message.text}
          </div>
        )}

        {/* KV 未設定の警告 */}
        {!settings?.kv_available && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            <strong>注意:</strong> Vercel KV 未設定のため、設定はメモリ内のみ保存されます（再起動でリセット）。
          </div>
        )}

        {/* ===== 監視設定 ===== */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">監視シミュレーション設定</h2>
          <form onSubmit={saveMonitoringSettings} className="space-y-5">
            {/* レスポンス遅延 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                レスポンス遅延 (ms)
              </label>
              <input
                type="number"
                min={0}
                max={30000}
                step={100}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                data-testid="delay-input"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                0 = 遅延なし。全ページへのレスポンスに適用されます。
              </p>
            </div>

            {/* エラーシミュレーション */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="error-enabled"
                  checked={errorEnabled}
                  onChange={(e) => setErrorEnabled(e.target.checked)}
                  data-testid="error-enabled-checkbox"
                  className="rounded border-gray-300"
                />
                <label htmlFor="error-enabled" className="text-sm font-medium text-gray-700">
                  HTTPエラーシミュレーションを有効にする
                </label>
              </div>

              {errorEnabled && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      エラー発生率 (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={errorRate}
                        onChange={(e) => setErrorRate(Number(e.target.value))}
                        data-testid="error-rate-slider"
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12 text-right">{errorRate}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      エラーコード
                    </label>
                    <select
                      value={errorCode}
                      onChange={(e) => setErrorCode(Number(e.target.value))}
                      data-testid="error-code-select"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ERROR_CODES.map((code) => (
                        <option key={code} value={code}>
                          HTTP {code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              data-testid="save-monitoring-button"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
            >
              {saving ? "保存中..." : "監視設定を保存"}
            </button>
          </form>
        </section>

        {/* ===== 認証情報変更 ===== */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">認証情報の変更</h2>
          <form onSubmit={saveCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいユーザーID</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                data-testid="new-username-input"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                data-testid="current-password-input"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新しいパスワード <span className="text-gray-400 font-normal">(変更しない場合は空欄)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="new-password-input"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {newPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード (確認)</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="confirm-password-input"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              data-testid="save-credentials-button"
              className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-500 text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
            >
              {saving ? "更新中..." : "認証情報を更新"}
            </button>
          </form>
        </section>

        {/* ===== API エンドポイント情報 ===== */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">監視エンドポイント一覧</h2>
          <p className="text-sm text-gray-500 mb-4">Grafana Cloud でチェックを設定する際に使用してください。</p>
          <div className="space-y-2 text-sm font-mono">
            {[
              { path: "/api/health", desc: "HTTPチェック用 (認証不要)", badge: "GET" },
              { path: "/login", desc: "ログイン画面 (ブラウザチェック起点)", badge: "PAGE" },
              { path: "/dashboard", desc: "ダッシュボード (認証後)", badge: "PAGE" },
              { path: "/features/page-a", desc: "機能A (コンテンツ検証: CONTENT_MARKER_FEATURE_A_OK)", badge: "PAGE" },
              { path: "/features/page-b", desc: "機能B (コンテンツ検証: CONTENT_MARKER_FEATURE_B_OK)", badge: "PAGE" },
              { path: "/features/page-c", desc: "機能C (コンテンツ検証: CONTENT_MARKER_FEATURE_C_OK)", badge: "PAGE" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${ep.badge === "GET" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {ep.badge}
                </span>
                <div>
                  <div className="text-gray-800">{ep.path}</div>
                  <div className="text-xs text-gray-400 font-sans mt-0.5">{ep.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
