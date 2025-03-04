import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { getCompanyById } from "~/utils/company.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";
import { createTransaction } from "~/utils/transaction.server";

type Transaction = {
  id: string;
  company_id: string;
  date: string;
  account: string;
  description: string | null;
  amount: number;
  type: "income" | "expense" | "asset" | "liability";
  created_at: string;
  updated_at: string | null;
};

// ActionData型の定義
type ActionData = {
  success: boolean;
  errors?: {
    _form?: string;
    date?: string;
    account?: string;
    amount?: string;
    type?: string;
  };
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await getUserFromSession(request);
  if (authError || !user) return redirect("/");
  const companyId = params.id;
  if (!companyId) return redirect("/dashboard");
  const { data: company, error: companyError } = await getCompanyById(request, companyId);
  if (companyError || !company)
    return json({ error: "企業情報の取得に失敗しました", company: null });
  return json({ company, error: null });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await getUserFromSession(request);
  if (authError || !user) return redirect("/");
  const companyId = params.id;
  if (!companyId) return redirect("/dashboard");

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
  if (!type) errors.type = "種類は必須です";
  
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) errors.amount = "金額は数値で入力してください";
  
  if (Object.keys(errors).length > 0) {
    return json({ success: false, errors });
  }

  const { error } = await createTransaction(request, {
    company_id: companyId,
    date,
    account,
    description: description || null,
    amount,
    type: type as "income" | "expense" | "asset" | "liability"
  });

  if (error) {
    return json({ 
      success: false, 
      errors: { _form: "取引の作成に失敗しました" }
    });
  }

  return redirect(`/companies/${companyId}/transactions`);
}

export default function NewTransaction() {
  const { company, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const actionData = useActionData<ActionData>();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

 return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4 flex items-center justify-center">
        <h2 className="text-xl font-semibold text-gray-900">新しい取引を追加</h2>
      </div>

      {actionData?.errors?._form && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md">
          {actionData.errors._form}
        </div>
      )}

      <Form method="post" className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            日付
          </label>
          <input
            type="date"
            id="date"
            name="date"
            defaultValue={date}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"
            required
          />
          {actionData?.errors?.date && (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.date}</p>
          )}
        </div>

        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700">
            勘定科目
          </label>
          <input
            type="text"
            id="account"
            name="account"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"
            required
          />
          {actionData?.errors?.account && (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.account}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            説明（任意）
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-24"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            金額
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">¥</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"
              placeholder="0"
              required
            />
          </div>
          {actionData?.errors?.amount && (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.amount}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            種類
          </label>
          <select
            id="type"
            name="type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"
            required
          >
            <option value="">選択してください</option>
            <option value="income">収益</option>
            <option value="expense">費用</option>
            <option value="asset">資産</option>
            <option value="liability">負債</option>
          </select>
          {actionData?.errors?.type && (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.type}</p>
          )}
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/companies/${company.id}/transactions`)}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              保存
            </button>
          </div>
        </div>
      </Form>
    </div>
 );
}