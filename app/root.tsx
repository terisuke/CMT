import { cssBundleHref } from "@remix-run/css-bundle";
import { json, type LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { AuthProvider } from "~/context/auth";
import tailwindStyles from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

// Loaderでサーバー側のENVを取得
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  });
}

export default function App() {
  // ブラウザ側でuseLoaderData()を使ってJSONを取得
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* 認証コンテキスト */}
        <AuthProvider>
          <Outlet />
        </AuthProvider>

        {/* ENVをwindow.ENVに埋め込む */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)};`,
          }}
        />

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}