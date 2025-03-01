import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "~/types/database";

// ブラウザでwindow.ENVを読むための型宣言
declare global {
  interface Window {
    ENV?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

// SSR中はwindowがないのでtypeof window !== 'undefined'でガード
const supabaseUrl =
  typeof window !== "undefined" && window.ENV?.SUPABASE_URL
    ? window.ENV.SUPABASE_URL
    : "";
const supabaseAnonKey =
  typeof window !== "undefined" && window.ENV?.SUPABASE_ANON_KEY
    ? window.ENV.SUPABASE_ANON_KEY
    : "";

// クライアント側のSupabaseクライアントを作成
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);