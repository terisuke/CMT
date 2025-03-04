# CMTプロジェクト

このプロジェクトはRemix、React、Supabaseを使用した現代的なWebアプリケーションです。

## 技術スタック

- **フロントエンド**: React 18、Remix 2.16
- **バックエンド**: Supabase (認証・データベース)
- **スタイリング**: TailwindCSS 3.4
- **言語**: TypeScript 5.1
- **その他**: React Hook Form、date-fns

## 開発環境のセットアップ

### 前提条件

- Node.js v20以上
- npmまたはyarn

### 環境変数の設定

1. `.env.template` ファイルを `.env` にコピーします
2. Supabaseプロジェクトの認証情報を設定します:

   ```
   SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
   SUPABASE_ANON_KEY=あなたのAnon Key
   ```

### 開発サーバーの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーは通常 <http://localhost:5173> で起動します。

## ディレクトリ構造

```
/
├── app/                  # アプリケーションのメインコード
│   ├── components/       # 再利用可能なUIコンポーネント
│   ├── routes/           # アプリケーションのルート
│   ├── utils/            # ユーティリティ関数
│   ├── types/            # TypeScript型定義
│   ├── context/          # Reactコンテキスト
│   ├── entry.client.tsx  # クライアントエントリーポイント
│   ├── entry.server.tsx  # サーバーエントリーポイント
│   ├── root.tsx          # ルートコンポーネント
│   └── tailwind.css      # TailwindCSSのインポート
├── public/               # 静的ファイル（画像、フォントなど）
```

## 本番環境へのデプロイ

本番環境用のビルドを作成:

```bash
npm run build
```

ビルドされたアプリケーションを起動:

```bash
npm start
```

デプロイする際は、`npm run build`の出力結果を使用します:

- `build/server`
- `build/client`

## 便利なコマンド

```bash
# TypeScriptの型チェック
npm run typecheck

# ESLintによるコード品質チェック
npm run lint
```

## 参考リンク

- [Remix ドキュメント](https://remix.run/docs)
- [Supabase ドキュメント](https://supabase.io/docs)
- [TailwindCSS ドキュメント](https://tailwindcss.com/docs)
- [React Hook Form ドキュメント](https://react-hook-form.com/get-started)
