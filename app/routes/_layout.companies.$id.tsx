import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useParams } from "@remix-run/react";
import AppLayout from "~/components/AppLayout";
import AuthGuard from "~/components/AuthGuard";
import { getCompanyById } from "~/utils/company.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  
  // getUser()メソッドを使用した認証チェック
  const { data: { user }, error: authError } = await getUserFromSession(request);
  
  if (authError || !user) {
    return redirect("/");
  }
  
  const companyId = params.id;
  if (!companyId) {
    return redirect("/dashboard");
  }
  
  // 企業情報を取得
  const { data: company, error } = await getCompanyById(request, companyId);
  
  if (error || !company) {
    return redirect("/dashboard");
  }
  
  return json({
    company
  });
}

export default function CompanyLayout() {
  const { company } = useLoaderData<typeof loader>();
  const location = useLocation();
  const params = useParams();
  
  // アクティブなタブを判定
  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };
  
  // 基本パス
  const basePath = `/companies/${params.id}`;
  
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          </div>
          
          {/* タブナビゲーション */}
          <div className="mb-6">
            <nav className="flex space-x-4" aria-label="Tabs">
              <Link
                to={basePath}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === basePath
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                概要
              </Link>
              <Link
                to={`${basePath}/transactions`}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/transactions')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                取引
              </Link>
              <Link
                to={`${basePath}/financials`}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/financials')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                財務諸表
              </Link>
            </nav>
          </div>
          
          <Outlet context={{ company }} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
} 