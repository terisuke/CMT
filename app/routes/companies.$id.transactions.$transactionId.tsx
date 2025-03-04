import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import AppLayout from "~/components/AppLayout";
import { createServerSupabaseClient } from "~/utils/supabase.server";
import { getCompanyById } from "~/utils/company.server";

// 取引データの型定義
type Transaction = {
  id: string;
  company_id: string;
  date: string;
  account: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense' | 'asset' | 'liability';
  created_at: string;
  updated_at: string | null;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return redirect("/");
  }
  
  const companyId = params.id;
  const transactionId = params.transactionId;
  
  if (!companyId || !transactionId) {
    return redirect("/dashboard");
  }
  
  // 企業情報を取得
  const { data: company, error: companyError } = await getCompanyById(request, companyId);
  
  if (companyError || !company) {
    return json({ 
      error: "企業情報の取得に失敗しました",
      company: null,
      transaction: null
    });
  }
  
  // 取引情報を取得
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('company_id', companyId)
    .single();
  
  if (transactionError || !transaction) {
    return json({ 
      error: "取引情報の取得に失敗しました",
      company,
      transaction: null
    });
  }
  
  return json({ 
    company, 
    transaction,
    error: null
  });
}

export default function TransactionDetail() {
  const { company, transaction, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  
  // 取引タイプに応じた表示文字列を返す
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return '収益';
      case 'expense': return '費用';
      case 'asset': return '資産';
      case 'liability': return '負債';
      default: return type;
    }
  };
  
  // 取引タイプに応じた色クラスを返す
  const getTypeColorClass = (type: string) => {
    switch (type) {
      case 'income': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'asset': return 'bg-blue-100 text-blue-800';
      case 'liability': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (error || !transaction) {
    return (
      <AppLayout 
        title={company ? `${company.name} - エラー` : "エラー"} 
        showBackButton={true} 
        backTo={company ? `/companies/${company.id}/transactions` : "/dashboard"}
      >
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error || "取引が見つかりません"}</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout 
      title={`${company.name} - 取引詳細`} 
      showBackButton={true} 
      backTo={`/companies/${company.id}/transactions`}
    >
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">取引詳細</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/companies/${company.id}/transactions/${transaction.id}/edit`)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              編集
            </button>
          </div>
        </div>
        
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">取引タイプ</dt>
              <dd className="mt-1 flex items-center">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColorClass(transaction.type)}`}>
                  {getTypeLabel(transaction.type)}
                </span>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">日付</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(transaction.date), 'yyyy年MM月dd日', { locale: ja })}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">勘定科目</dt>
              <dd className="mt-1 text-sm text-gray-900">{transaction.account}</dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">金額</dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">
                {transaction.amount.toLocaleString()} 円
              </dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">説明</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {transaction.description || "説明はありません"}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">作成日時</dt>
              <dd className="mt-1 text-sm text-gray-500">
                {format(new Date(transaction.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
              </dd>
            </div>
            
            {transaction.updated_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-sm text-gray-500">
                  {format(new Date(transaction.updated_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                </dd>
              </div>
            )}
          </dl>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => navigate(`/companies/${company.id}/transactions`)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            戻る
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/companies/${company.id}/transactions/${transaction.id}/edit`)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              編集
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}