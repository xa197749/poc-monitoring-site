# POC Monitoring Site

Grafana Cloud 外形監視 (Synthetic Monitoring) の検証用 Web サイトです。

## 機能

- ユーザーID / パスワード認証
- ログイン後の複数ページ遷移
- ユーザーID・パスワードの変更
- レスポンスタイムの動的変更
- HTTPエラーシミュレーション（エラー率・エラーコード設定）
- Grafana 用ヘルスチェック API (`/api/health`)
- Playwright 自動化のための `data-testid` 属性

## セットアップ

### 1. 環境変数の設定

`.env.example` を `.env.local` にコピーして編集:

```bash
cp .env.example .env.local
```

```env
JWT_SECRET=<openssl rand -base64 32 で生成>
INITIAL_USERNAME=admin
INITIAL_PASSWORD=password123
```

### 2. ローカル起動

```bash
npm install
npm run dev
```

### 3. Vercel へのデプロイ

```bash
# Vercel CLI でデプロイ
npx vercel deploy --prod
```

または GitHub に push して Vercel ダッシュボードから連携。

### 4. Vercel KV の設定（推奨）

Vercel KV を設定すると、レスポンス遅延・エラー設定が複数のサーバーインスタンス間で永続化されます。

1. Vercel ダッシュボード → Storage → Create Database → KV
2. プロジェクトと連携 → 環境変数が自動で設定される
3. 再デプロイ

**KV なしの場合:** 設定はメモリ内のみ保存され、サーバー再起動（cold start）でリセットされます。

---

## Grafana Cloud での監視設定例

### HTTP チェック（ヘルスチェック API）

| 項目 | 値 |
|------|-----|
| URL | `https://<your-site>/api/health` |
| メソッド | GET |
| 期待ステータス | 200 |
| コンテンツチェック | `"status":"ok"` |

### ブラウザチェック（ログインフロー）

Grafana Synthetic Monitoring の k6 Browser スクリプト例:

```javascript
import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    // 1. ログイン
    await page.goto('https://<your-site>/login');
    await page.locator('[data-testid="username-input"]').fill('admin');
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="login-button"]').click();

    // 2. ダッシュボード確認
    await page.waitForURL('**/dashboard');
    check(page, {
      'dashboard loaded': (p) => p.locator('[data-testid="dashboard-heading"]').isVisible(),
    });

    // 3. 機能Aに遷移
    await page.locator('[data-testid="feature-a-button"]').click();
    await page.waitForURL('**/features/page-a');
    check(page, {
      'feature-a loaded': (p) => p.locator('[data-testid="feature-heading"]').isVisible(),
    });
  } finally {
    await page.close();
  }
}
```

---

## 監視エンドポイント一覧

| エンドポイント | 説明 | 認証 |
|----------------|------|------|
| `/api/health` | HTTP チェック用。JSON でステータスを返す | 不要 |
| `/login` | ブラウザチェック起点 | 不要 |
| `/dashboard` | ダッシュボード | 要ログイン |
| `/features/page-a` | 機能A（コンテンツ検証: `CONTENT_MARKER_FEATURE_A_OK`） | 要ログイン |
| `/features/page-b` | 機能B（コンテンツ検証: `CONTENT_MARKER_FEATURE_B_OK`） | 要ログイン |
| `/features/page-c` | 機能C（コンテンツ検証: `CONTENT_MARKER_FEATURE_C_OK`） | 要ログイン |

---

## エラーシミュレーションの使い方

1. ログイン後、「設定」ページを開く
2. 「監視シミュレーション設定」で設定:
   - **レスポンス遅延**: ミリ秒単位（例: 3000ms = 3秒）
   - **エラーシミュレーション**: 有効化 → 発生率(%) → HTTPエラーコード
3. 保存後、即座に全リクエストへ適用される
