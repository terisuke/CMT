import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { createServerClient } from "@supabase/ssr";
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
    
    console.log("Signup attempt with:", email);
    
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
      options: {
        emailRedirectTo: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/dashboard` : `${request.headers.get('origin')}/dashboard`
      }
    });
    
    console.log("Signup result:", { data, error });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return redirect("/dashboard");
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

// このルートはUIがなく、アクションのみを処理します
export default function Auth() {
  return null;
}