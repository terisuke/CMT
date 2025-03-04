import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation, useNavigate, useRevalidator, useSubmit } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useState } from "react";
import { getCompanyById } from "~/utils/company.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";
import { deleteTransaction, getTransactionsByCompanyId } from "~/utils/transaction.server";

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
  const { data: { user }, error: authError } = await getUserFromSession(request);
  if (authError || !user) {
    return redirect("/");
  }
  const companyId = params.id;
  if (!companyId) {
    return redirect("/dashboard");
  }
  const { data: company, error: companyError } = await getCompanyById(request, companyId);
  if (companyError || !company) {
    return json({
      error: "企業情報の取得に失敗しました",
      company: null,
      transactions: []
    });
  }
  const { data: transactions, error } = await getTransactionsByCompanyId(request, companyId);
  if (error) {
    return json({
      error: "取引データの取得に失敗しました",
      company,
      transactions: [],
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
  const { data: { user }, error: authError } = await getUserFromSession(request);
  if (authError || !user) {
    return redirect("/");
  }
  const companyId = params.id;
  if (!companyId) {
    return redirect("/dashboard");
  }
  const formData = await request.formData();
  const actionType = formData.get("_action");
  if (actionType === "delete") {
    const transactionId = formData.get("transactionId");
    if (!transactionId || typeof transactionId !== 'string') {
      return json({
        success: false,
        error: "取引IDが無効です"
      });
    }
    const { error } = await deleteTransaction(request, transactionId);
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
  const location = useLocation();
  const [filter, setFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const revalidator = useRevalidator();

  // モーダルの状態をリセットするためのエフェクト
  useEffect(() => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  }, [location.pathname]);

  const filteredTransactions = transactions.filter(
    (t: Transaction) => filter === 'all' || t.type === filter
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return '収益';
      case 'expense': return '費用';
      case 'asset': return '資産';
      case 'liability': return '負債';
      default: return type;
    }
  };

  const getTypeColorClass = (type: string) => {
    switch (type) {
      case 'income': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'asset': return 'bg-blue-100 text-blue-800';
      case 'liability': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openDeleteModal = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleDelete = () => {
    if (!transactionToDelete) return;
    const formData = new FormData();
    formData.append('_action', 'delete');
    formData.append('transactionId', transactionToDelete.id);
    submit(formData, { method: 'post' });
    closeDeleteModal();
    revalidator.revalidate();
  };

  // 子ルート（新規作成や詳細・編集画面）の場合は Outlet をレンダリング
  const pathname = location.pathname;
  const segments = pathname.split('/');
  if (segments.length > 4) {
    return <Outlet context={{ company }} />;
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={() => navigate(`/companies/${company.id}`)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h3 className="text-lg leading-6 font-medium text-gray-900">取引一覧</h3>
          <div className="flex items-center gap-4">
            <div>
              <label htmlFor="filter" className="sr-only">フィルター</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">すべて</option>
                <option value="income">収益</option>
                <option value="expense">費用</option>
                <option value="asset">資産</option>
                <option value="liability">負債</option>
              </select>
            </div>
            <button
              onClick={() => navigate(`/companies/${company.id}/transactions/new`)}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              取引を追加
            </button>
          </div>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">取引データがありません。</p>
            <button
              onClick={() => navigate(`/companies/${company.id}/transactions/new`)}
              className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              最初の取引を追加
            </button>
          </div>
        ) : (
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
                    金額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    種類
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction: Transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.date), 'yyyy年MM月dd日', { locale: ja })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.account}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColorClass(transaction.type)}`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/companies/${company.id}/transactions/${transaction.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        詳細
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
        )}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">取引の削除</h3>
            <p className="text-sm text-gray-500 mb-4">
              本当にこの取引を削除しますか？この操作は元に戻せません。
            </p>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}