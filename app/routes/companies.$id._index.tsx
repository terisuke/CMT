import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { getCompanyById } from "~/utils/company.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  
  // 認証チェック
  const { data: { user }, error: authError } = await getUserFromSession(request);
  
  if (authError || !user) {
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-gray-500">企業情報が見つかりません</div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/companies/${company.id}/transactions`)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取引データを管理
            </button>
            <button
              onClick={() => navigate(`/companies/${company.id}/financials`)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              財務諸表を表示
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 