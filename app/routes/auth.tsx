import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { createServerClient } from "@supabase/ssr";
import { createProfile } from "~/utils/profile.server";
import { Database } from "~/types/database";

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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "signup") {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
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

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    // ユーザープロフィールを作成
    if (data.user) {
      const { error: profileError } = await createProfile(request, data.user.id);
      
      if (profileError) {
        return json({ error: "ユーザープロフィールの作成に失敗しました" }, { status: 500 });
      }
    }

    return redirect("/dashboard");
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

// このルートはUIがなく、アクションのみを処理します
export default function Auth() {
  return null;
}