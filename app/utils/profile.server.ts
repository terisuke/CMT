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

export async function createProfile(
  request: Request,
  userId: string,
  name: string = '',
  role: 'user' | 'manager' = 'user'
) {
  const cookieHeader = request.headers.get('Cookie');
  const supabaseClient = createServerClient<Database>(
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

  const { error } = await supabaseClient
    .from('profiles')
    .insert({
      id: userId,
      name,
      role,
      created_at: new Date().toISOString(),
    });

  return { error };
}

export async function getProfile(request: Request, userId: string) {
  const cookieHeader = request.headers.get('Cookie');
  const supabaseClient = createServerClient<Database>(
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

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}