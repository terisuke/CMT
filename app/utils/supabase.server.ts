import { createServerClient } from '@supabase/ssr';
import { Database } from '~/types/database';

// Cookieパーサーヘルパー
function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [name, ...rest] = cookie.split('=');
      return [name.trim(), rest.join('=')];
    })
  );
}

// サーバーサイドで使用するSupabaseクライアントを作成する関数
export function createServerSupabaseClient(request: Request) {
  const cookieHeader = request.headers.get('Cookie');
  
  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return parseCookies(cookieHeader)[name];
        },
        set(_name, _value, _options) {
          // Remix will handle setting cookies
        },
        remove(_name, _options) {
          // Remix will handle removing cookies
        },
      },
    }
  );
}

/**
 * サーバーサイドでユーザー情報を取得する関数
 * auth.tsxの認証方式と一致させるための関数
 */
export async function getUserFromSession(request: Request) {
  const supabase = createServerSupabaseClient(request);
  return await supabase.auth.getUser();
}