import { useState } from "react";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { createServerSupabaseClient } from "~/utils/supabase.server";
import { createCompany } from "~/utils/company.server";
import AppLayout from "~/components/AppLayout";

// アクションの戻り値の型を定義
type ActionData = {
  errors?: {
    name?: string;
    form?: string;
  };
  values?: {
    name?: string;
    businessType?: string;
    representative?: string;
    establishedDate?: string;
    address?: string;
    phone?: string;
  };
};

export async function action({ request }: ActionFunctionArgs) {
  const supabase = createServerSupabaseClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return redirect("/");
  }
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const businessType = formData.get("businessType") as string;
  const representative = formData.get("representative") as string;
  const establishedDate = formData.get("establishedDate") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  
  // バリデーション
  const errors: Record<string, string> = {};
  if (!name) errors.name = "企業名は必須です";
  
  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ 
      errors, 
      values: { name, businessType, representative, establishedDate, address, phone } 
    });
  }
  
  // 企業を作成
  const { data, error } = await createCompany(request, session.user.id, {
    name,
    business_type: businessType || null,
    representative: representative || null,
    established_date: establishedDate || null,
    address: address || null,
    phone: phone || null,
  });
  
  if (error) {
    return json<ActionData>({ 
      errors: { form: "企業の作成に失敗しました" },
      values: { name, businessType, representative, establishedDate, address, phone }
    });
  }
  
  return redirect("/dashboard");
}

export default function NewCompany() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  return (
    <AppLayout title="企業を追加" showBackButton={true} backTo="/dashboard">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">企業を追加</h2>
            <p className="mt-1 text-sm text-gray-500">
              新しい企業情報を入力してください。
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={actionData?.values?.name || ""}
                required
                className={`mt-1 block w-full h-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  actionData?.errors?.name ? "border-red-300" : ""
                }`}
              />
              {actionData?.errors?.name && (
                <p className="mt-2 text-sm text-red-600">{actionData.errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                業種
              </label>
              <input
                id="businessType"
                name="businessType"
                type="text"
                defaultValue={actionData?.values?.businessType || ""}
                className="mt-1 block w-full h-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="representative" className="block text-sm font-medium text-gray-700">
                代表者
              </label>
              <input
                id="representative"
                name="representative"
                type="text"
                defaultValue={actionData?.values?.representative || ""}
                className="mt-1 block w-full h-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="establishedDate" className="block text-sm font-medium text-gray-700">
                設立日
              </label>
              <input
                id="establishedDate"
                name="establishedDate"
                type="date"
                defaultValue={actionData?.values?.establishedDate || ""}
                className="mt-1 block w-full h-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                住所
              </label>
              <input
                id="address"
                name="address"
                type="text"
                defaultValue={actionData?.values?.address || ""}
                className="mt-1 block w-full h-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                電話番号
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                defaultValue={actionData?.values?.phone || ""}
                className="mt-1 block w-full h-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
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
