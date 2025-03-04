import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import AppLayout from "~/components/AppLayout";
import { getCompanyById } from "~/utils/company.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

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
  const { data: company, error: companyError } = await getCompanyById(request, companyId);
  
  if (companyError || !company) {
    return json({ 
      error: "企業情報の取得に失敗しました",
      company: null,
      transactions: []
    });
  }
  
  // 取引データを取得
  const { data: transactions, error: transactionError } = await supabase
    .from('transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: false });
  
  if (transactionError) {
    return json({ 
      company,
      transactions: [],
      error: "取引データの取得に失敗しました"
    });
  }
  
  return json({ 
    company, 
    transactions: transactions || [],
    error: null
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
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
  
  const formData = await request.formData();
  const actionType = formData.get("_action") as string;
  
  if (actionType === "deleteTransaction") {
    const transactionId = formData.get("transactionId") as string;
    
    if (!transactionId) {
      return json({
        success: false,
        error: "取引IDが指定されていません"
      });
    }
    
    // 取引を削除
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('company_id', companyId);
    
    if (error) {
      return json({
        success: false,
        error: "取引の削除に失敗しました"
      });
    }
    
    return json({
      success: true,
      error: null
    });
  }
  
  return json({
    success: false,
    error: "不明なアクションタイプです"
  });
}

export default function TransactionsList() {
  const { company, transactions, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [filter, setFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // 表示する取引をフィルタリング
  const filteredTransactions = transactions.filter(
    (t: Transaction) => filter === 'all' || t.type === filter
  );
  
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
  
  // 削除ダイアログを表示
  const openDeleteModal = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };
  
  // 削除ダイアログを閉じる
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };
  
  // 取引を削除
  const handleDelete = () => {
    if (!transactionToDelete) return;
    
    const formData = new FormData();
    formData.append("_action", "deleteTransaction");
    formData.append("transactionId", transactionToDelete.id);
    
    submit(formData, {
      method: "post",
      replace: true
    });
    
    closeDeleteModal();
  };
  
  return (
    <AppLayout title={`${company?.name} - 取引一覧`} showBackButton={true} backTo={`/companies/${company?.id}`}>
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">取引一覧</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/companies/${company?.id}/transactions/new`)}
              className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              取引を追加
            </button>
            <button
              onClick={() => navigate(`/companies/${company?.id}/financials`)}
              className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-2"
            >
              財務諸表
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'income' ? 'bg-green-200 text-green-800' : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              収益
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'expense' ? 'bg-red-200 text-red-800' : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              費用
            </button>
            <button
              onClick={() => setFilter('asset')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'asset' ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              資産
            </button>
            <button
              onClick={() => setFilter('liability')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'liability' ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
              }`}
            >
              負債
            </button>
          </div>
        </div>
        
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    勘定科目
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction: Transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ja })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.account}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{transaction.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColorClass(transaction.type)}`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.amount.toLocaleString()} 円
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/companies/${company?.id}/transactions/${transaction.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        詳細
                      </button>
                      <button 
                        onClick={() => navigate(`/companies/${company?.id}/transactions/${transaction.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => openDeleteModal(transaction)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">取引データがありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              「取引を追加」ボタンから新しい取引を登録してください。
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate(`/companies/${company?.id}/transactions/new`)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取引を追加
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">取引の削除</h3>
            <p className="text-sm text-gray-500">
              本当に以下の取引を削除しますか？この操作は取り消せません。
            </p>
            {transactionToDelete && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">日付：</div>
                  <div>{format(new Date(transactionToDelete.date), 'yyyy/MM/dd', { locale: ja })}</div>
                  <div className="font-medium">勘定科目：</div>
                  <div>{transactionToDelete.account}</div>
                  <div className="font-medium">金額：</div>
                  <div>{transactionToDelete.amount.toLocaleString()} 円</div>
                  <div className="font-medium">タイプ：</div>
                  <div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColorClass(transactionToDelete.type)}`}>
                      {getTypeLabel(transactionToDelete.type)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}