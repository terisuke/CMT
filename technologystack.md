# 技術スタック（※本記載は記入例です-プロジェクトに合わせて内容を更新してください-）

## コア技術

- TypeScript: ^5.1.6
- Node.js: ^20.0.0  
- **AIモデル: claude-3-7-sonnet-20250219 (Anthropic Messages API 2023-06-01) ← バージョン変更禁止**

## フロントエンド

- Remix: ^2.16.0
- React: ^18.2.0
- Tailwind CSS: ^3.4.17
- React Hook Form: ^7.54.2
- date-fns: ^4.1.0

## バックエンド

- Supabase: ^2.49.1
- Supabase Auth Helpers: ^0.4.0
- Supabase SSR: ^0.5.2

## 開発ツール

- npm: ^10.0.0
- ESLint: ^8.38.0
- TypeScript: ^5.1.6
- Vite: ^6.0.0

---

# Supabase連携管理

## 重要な制約事項

- Supabaseクライアントは `app/utils/supabase.ts` で一元管理
- 認証フローは `app/context/auth.tsx` で管理
- 環境変数は `.env` ファイルで管理：
  - SUPABASE_URL - Supabaseプロジェクトのエンドポイント
  - SUPABASE_ANON_KEY - 匿名キー

## 実装規則

- Supabase関連の型定義は `app/types/` ディレクトリに配置
- 環境変数へのアクセスはユーティリティ関数経由が推奨
