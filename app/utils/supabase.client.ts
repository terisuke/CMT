import { createBrowserClient } from '@supabase/ssr';
import { Database } from '~/types/database';

// クライアント側のSupabaseクライアントを作成
export const supabase = createBrowserClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);