/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import AppLayout from "~/components/AppLayout";
import { useAuth } from "~/context/auth";
import { getUserCompanies } from "~/utils/company.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

// APIから実際に返される構造に合わせた型定義
type LoaderData = {
  companies: any[]; // 一時的にanyを使用して型エラーを回避
  userId: string | null;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  
  // getUser()メソッドを使用した認証チェック
  const { data: { user }, error: authError } = await getUserFromSession(request);
  
  if (authError || !user) {
    return json<LoaderData>({ 
      companies: [],
      userId: null
    });
  }
  
  const { data: userCompanies, error } = await getUserCompanies(request, user.id);
  
  if (error) {
    console.error("Error fetching companies:", error);
    return json<LoaderData>({ 
      companies: [],
      userId: user.id,
      error: "企業データの取得に失敗しました" 
    });
  }
  
  // データのロギング
  console.log("Fetched companies data:", JSON.stringify(userCompanies, null, 2));
  
  return json<LoaderData>({ 
    companies: userCompanies || [],
    userId: user.id
  });
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { companies, userId, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <AppLayout title="ダッシュボード">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">企業一覧</h2>
          <button 
            onClick={() => navigate('/companies/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            企業を追加
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 mb-4 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {companies && companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    企業名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    業種
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代表者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((item) => {
                  // companiesフィールドが配列である可能性があるのでチェック
                  const company = Array.isArray(item.companies) 
                    ? item.companies[0] 
                    : item.companies;
                    
                  // item.companies がない場合はスキップ
                  if (!company) return null;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{company.business_type || '未設定'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{company.representative || '未設定'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {company.created_at 
                            ? format(new Date(company.created_at), 'yyyy年MM月dd日', { locale: ja })
                            : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.role === 'owner' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.role === 'owner' ? 'オーナー' : 'メンバー'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/companies/${company.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          詳細
                        </button>
                        <button 
                          onClick={() => navigate(`/companies/${company.id}/transactions`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          取引
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">企業がまだありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              「企業を追加」ボタンから新しい企業を登録してください。
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/companies/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                企業を追加
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}