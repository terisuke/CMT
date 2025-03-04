# ディレクトリ構成

以下のディレクトリ構造に従って実装を行ってください：

```
/
├── app/                          # Remixのアプリケーションディレクトリ
│   ├── components/               # アプリケーションコンポーネント
│   │   ├── ui/                   # 基本UI（button, card等）
│   │   └── layout/               # レイアウト関連
│   ├── routes/                   # アプリケーションのルート定義
│   │   └── [route]/              # 各ルートファイル
│   │       └── route.tsx
│   ├── context/                  # Reactコンテキスト
│   ├── utils/                    # ユーティリティ関数
│   ├── types/                    # TypeScript型定義
│   ├── entry.client.tsx          # クライアントエントリーポイント
│   ├── entry.server.tsx          # サーバーエントリーポイント
│   ├── root.tsx                  # ルートコンポーネント
│   └── tailwind.css              # TailwindCSSのインポート
├── public/                       # 静的ファイル
├── build/                        # ビルド出力ディレクトリ
│   ├── client/                   # クライアントビルド
│   └── server/                   # サーバービルド
├── node_modules/                 # 依存パッケージ
├── .git/                         # Gitリポジトリ
├── .cursor/                      # Cursor設定
├── package.json                  # プロジェクト設定
├── package-lock.json             # 依存関係ロックファイル
├── tsconfig.json                 # TypeScript設定
├── vite.config.ts                # Vite設定
├── tailwind.config.ts            # Tailwind設定
├── postcss.config.js             # PostCSS設定
├── .eslintrc.cjs                 # ESLint設定
├── .env                          # 環境変数
└── .gitignore                    # Git除外設定
```

### 配置ルール

- UIコンポーネント → `app/components/ui/`
- ルート定義 → `app/routes/[route]/route.tsx`
- 共通処理 → `app/utils/`
- 型定義 → `app/types/`
