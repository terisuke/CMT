import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import AppLayout from "~/components/AppLayout";
import AuthGuard from "~/components/AuthGuard";
import { getCompanyById } from "~/utils/company.server";
import { createServerSupabaseClient } from "~/utils/supabase.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return redirect("/");
  }
  
  const companyId = params.id;
  if (!companyId) {
    return redirect("/dashboard");
  }
  
  // 企業の詳細を取得
  const { data: company, error } = await getCompanyById(request, companyId);
  
  if (error || !company) {
    return json({ 
      error: "企業情報の取得に失敗しました",
      company: null
    });
  }
  
  return json({ company, error: null });
}

export default function CompanyDetail() {
  const { company, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 shadow rounded-lg">
            <h1 className="text-red-500 text-lg font-medium">エラー</h1>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }
  
  if (!company) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 shadow rounded-lg">
            <h1 className="text-gray-900 text-lg font-medium">企業が見つかりません</h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }
  
  return (
    <AppLayout title={company.name} showBackButton={true} backTo="/dashboard">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{company.name}</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/companies/${company.id}/edit`)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              編集
            </button>
            <button
              onClick={() => navigate(`/companies/${company.id}/transactions`)}
              className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              取引一覧
            </button>
          </div>
        </div>
          
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">業種</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.business_type || "未設定"}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">代表者</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.representative || "未設定"}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">設立日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {company.established_date 
                  ? format(new Date(company.established_date), 'yyyy年MM月dd日', { locale: ja })
                  : "未設定"}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">住所</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.address || "未設定"}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">電話番号</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.phone || "未設定"}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">登録日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {company.created_at 
                  ? format(new Date(company.created_at), 'yyyy年MM月dd日', { locale: ja })
                  : ""}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">財務情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">売上高</h4>
            <p className="text-2xl font-bold text-gray-900">-- 円</p>
            <p className="text-sm text-gray-500 mt-1">取引データがありません</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">営業利益</h4>
            <p className="text-2xl font-bold text-gray-900">-- 円</p>
            <p className="text-sm text-gray-500 mt-1">取引データがありません</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">総資産</h4>
            <p className="text-2xl font-bold text-gray-900">-- 円</p>
            <p className="text-sm text-gray-500 mt-1">取引データがありません</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(`/companies/${company.id}/transactions`)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            取引データを管理
          </button>
        </div>
      </div>
    </AppLayout>
  );
}