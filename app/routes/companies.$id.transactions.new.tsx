import { useState } from "react";
import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigate } from "@remix-run/react";
import AppLayout from "~/components/AppLayout";
import { createServerSupabaseClient } from "~/utils/supabase.server";
import { getCompanyById } from "~/utils/company.server";

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
  
  // 企業情報を取得
  const { data: company, error: companyError } = await getCompanyById(request, companyId);
  
  if (companyError || !company) {
    return json({ 
      error: "企業情報の取得に失敗しました",
      company: null,
    });
  }
  
  return json({ company, error: null });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return redirect("/");
  }
  
  const companyId = params.id;
  if (!companyId) {
    return redirect("/dashboard");
  }
  
  const formData = await request.formData();
  const date = formData.get("date") as string;
  const account = formData.get("account") as string;
  const description = formData.get("description") as string;
  const amountStr = formData.get("amount") as string;
  const type = formData.get("type") as string;
  
  // バリデーション
  const errors: Record<string, string> = {};
  if (!date) errors.date = "日付は必須です";
  if (!account) errors.account = "勘定科目は必須です";
  if (!amountStr) errors.amount = "金額は必須です";
  if (!type) errors.type = "取引タイプは必須です";
  
  // 金額の検証
  let amount: number;
  try {
    // カンマを取り除いて数値に変換
    amount = Number(amountStr.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      errors.amount = "金額は正の数値を入力してください";
    }
  } catch (e) {
    errors.amount = "金額は正の数値を入力してください";
    amount = 0;
  }
  
  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ 
      errors,
      values: { date, account, description, amount: amountStr, type }
    });
  }
  
  // 取引データを登録
  const { error } = await supabase
    .from('transactions')
    .insert({
      company_id: companyId,
      date,
      account,
      description: description || null,
      amount,
      type: type as 'income' | 'expense' | 'asset' | 'liability',
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    return json<ActionData>({ 
      errors: { form: "取引の登録に失敗しました" },
      values: { date, account, description, amount: amountStr, type }
    });
  }
  
  return redirect(`/companies/${companyId}/transactions`);
}

export default function NewTransaction() {
  const { company, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (error) {
    return (
      <AppLayout title="エラー" showBackButton={true} backTo="/dashboard">
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title={`${company?.name} - 取引を追加`} showBackButton={true} backTo={`/companies/${company?.id}/transactions`}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">取引を追加</h2>
            <p className="mt-1 text-sm text-gray-500">
              新しい取引情報を入力してください。
            </p>
          </div>
          
          <Form 
            method="post" 
            onSubmit={() => setIsSubmitting(true)}
            className="space-y-6"
          >
            {actionData?.errors?.form && (
              <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm">
                {actionData.errors.form}
              </div>
            )}
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={actionData?.values?.date || new Date().toISOString().slice(0, 10)}
                required
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  actionData?.errors?.date ? "border-red-300" : ""
                }`}
              />
              {actionData?.errors?.date && (
                <p className="mt-2 text-sm text-red-600">{actionData.errors.date}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                取引タイプ <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                defaultValue={actionData?.values?.type || ""}
                required
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  actionData?.errors?.type ? "border-red-300" : ""
                }`}
              >
                <option value="" disabled>選択してください</option>
                <option value="income">収益</option>
                <option value="expense">費用</option>
                <option value="asset">資産</option>
                <option value="liability">負債</option>
              </select>
              {actionData?.errors?.type && (
                <p className="mt-2 text-sm text-red-600">{actionData.errors.type}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700">
                勘定科目 <span className="text-red-500">*</span>
              </label>
              <input
                id="account"
                name="account"
                type="text"
                defaultValue={actionData?.values?.account || ""}
                required
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  actionData?.errors?.account ? "border-red-300" : ""
                }`}
              />
              {actionData?.errors?.account && (
                <p className="mt-2 text-sm text-red-600">{actionData.errors.account}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                金額 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="numeric"
                  defaultValue={actionData?.values?.amount || ""}
                  placeholder="0"
                  required
                  className={`pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    actionData?.errors?.amount ? "border-red-300" : ""
                  }`}
                />
              </div>
              {actionData?.errors?.amount && (
                <p className="mt-2 text-sm text-red-600">{actionData.errors.amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={actionData?.values?.description || ""}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/companies/${company?.id}/transactions`)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "保存中..." : "保存"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </AppLayout>
  );
}