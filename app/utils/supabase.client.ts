import { createClient } from '@supabase/supabase-js';

// window.ENVの型定義を追加
declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    }
  }
}

// これは環境変数をクライアントに公開することになるので、
// 本番環境では適切な処理が必要です
const supabaseUrl = typeof document !== 'undefined' 
  ? window.ENV.SUPABASE_URL 
  : process.env.SUPABASE_URL;
const supabaseAnonKey = typeof document !== 'undefined'
  ? window.ENV.SUPABASE_ANON_KEY
  : process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE credentials are missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);