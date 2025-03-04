import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigate, useOutletContext } from "@remix-run/react";
import { useState } from "react";
import AppLayout from "~/components/AppLayout";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

// ActionDataの型定義
type ActionData = {
  errors?: {
    date?: string;
    account?: string;
    amount?: string;
    type?: string;
    form?: string;
  };
  values?: {
    date?: string;
    account?: string;
    description?: string;
    amount?: string;
    type?: string;
  };
};

type OutletContextType = {
  company: {
    id: string;
    name: string;
  };
};

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
  
  return json({});
}

export async function action({ request, params }: ActionFunctionArgs) {
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
  
  // フォームデータの取得
  const formData = await request.formData();
  const date = formData.get("date")?.toString();
  const account = formData.get("account")?.toString();
  const description = formData.get("description")?.toString();
  const amountStr = formData.get("amount")?.toString();
  const type = formData.get("type")?.toString();
  
  // バリデーション
  const errors: ActionData["errors"] = {};
  const values: ActionData["values"] = {
    date,
    account,
    description,
    amount: amountStr,
    type
  };
  
  if (!date) {
    errors.date = "日付は必須項目です";
  }
  
  if (!account) {
    errors.account = "勘定科目は必須項目です";
  }
  
  if (!amountStr) {
    errors.amount = "金額は必須項目です";
  }
  
  if (!type || !['income', 'expense', 'asset', 'liability'].includes(type)) {
    errors.type = "有効な取引タイプを選択してください";
  }
  
  // 数値変換
  let amount: number;
  try {
    amount = amountStr ? parseFloat(amountStr) : 0;
    if (isNaN(amount)) {
      errors.amount = "金額には数値を入力してください";
    }
  } catch (e) {
    errors.amount = "金額には数値を入力してください";
    amount = 0;
  }
  
  // エラーがある場合は処理を中断
  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ errors, values });
  }
  
  // データベースに保存
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        company_id: companyId,
        date,
        account,
        description,
        amount,
        type
      }
    ]);
  
  if (error) {
    return json<ActionData>({
      errors: {
        form: "取引の保存に失敗しました: " + error.message
      },
      values
    });
  }
  
  // 成功したらトランザクション一覧ページにリダイレクト
  return redirect(`/companies/${companyId}/transactions`);
}

export default function NewTransaction() {
  const actionData = useActionData<typeof action>();
  const { company } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  
  const [transactionType, setTransactionType] = useState(actionData?.values?.type || "expense");
  
  return (
    <AppLayout title={`${company.name} - 取引追加`} showBackButton={true} backTo={`/companies/${company.id}/transactions`}>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">取引追加</h3>
        </div>
        
        <div className="px-6 py-5">
          {actionData?.errors?.form && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{actionData.errors.form}</p>
            </div>
          )}
          
          <Form method="post">
            <div className="space-y-6">
              {/* 取引タイプ */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  取引タイプ
                </label>
                <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className={`border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase 
                    ${transactionType === 'income' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                  >
                    <input
                      id="type-income"
                      name="type"
                      type="radio"
                      value="income"
                      checked={transactionType === 'income'}
                      onChange={() => setTransactionType('income')}
                      className="sr-only"
                    />
                    <label htmlFor="type-income" className="cursor-pointer w-full h-full flex items-center justify-center">
                      収益
                    </label>
                  </div>
                  <div className={`border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase 
                    ${transactionType === 'expense' 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                  >
                    <input
                      id="type-expense"
                      name="type"
                      type="radio"
                      value="expense"
                      checked={transactionType === 'expense'}
                      onChange={() => setTransactionType('expense')}
                      className="sr-only"
                    />
                    <label htmlFor="type-expense" className="cursor-pointer w-full h-full flex items-center justify-center">
                      費用
                    </label>
                  </div>
                  <div className={`border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase 
                    ${transactionType === 'asset' 
                      ? 'bg-blue-50 border-blue-200 text-blue-800' 
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                  >
                    <input
                      id="type-asset"
                      name="type"
                      type="radio"
                      value="asset"
                      checked={transactionType === 'asset'}
                      onChange={() => setTransactionType('asset')}
                      className="sr-only"
                    />
                    <label htmlFor="type-asset" className="cursor-pointer w-full h-full flex items-center justify-center">
                      資産
                    </label>
                  </div>
                  <div className={`border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase 
                    ${transactionType === 'liability' 
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                  >
                    <input
                      id="type-liability"
                      name="type"
                      type="radio"
                      value="liability"
                      checked={transactionType === 'liability'}
                      onChange={() => setTransactionType('liability')}
                      className="sr-only"
                    />
                    <label htmlFor="type-liability" className="cursor-pointer w-full h-full flex items-center justify-center">
                      負債
                    </label>
                  </div>
                </div>
                {actionData?.errors?.type && (
                  <p className="mt-2 text-sm text-red-600">{actionData.errors.type}</p>
                )}
              </div>
              
              {/* 日付 */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">日付 <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="date"
                    id="date"
                    defaultValue={actionData?.values?.date}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                {actionData?.errors?.date && (
                  <p className="mt-2 text-sm text-red-600">{actionData.errors.date}</p>
                )}
              </div>
              
              {/* 勘定科目 */}
              <div>
                <label htmlFor="account" className="block text-sm font-medium text-gray-700">勘定科目 <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="account"
                    id="account"
                    defaultValue={actionData?.values?.account}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="例: 売上、家賃、消耗品費"
                  />
                </div>
                {actionData?.errors?.account && (
                  <p className="mt-2 text-sm text-red-600">{actionData.errors.account}</p>
                )}
              </div>
              
              {/* 説明 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">説明</label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    defaultValue={actionData?.values?.description}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="取引の詳細を記入してください"
                  />
                </div>
              </div>
              
              {/* 金額 */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">金額 <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">¥</span>
                  </div>
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    defaultValue={actionData?.values?.amount}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0"
                    aria-describedby="amount-currency"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm" id="amount-currency">JPY</span>
                  </div>
                </div>
                {actionData?.errors?.amount && (
                  <p className="mt-2 text-sm text-red-600">{actionData.errors.amount}</p>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/companies/${company.id}/transactions`)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                保存
              </button>
            </div>
          </Form>
        </div>
      </div>
    </AppLayout>
  );
} 