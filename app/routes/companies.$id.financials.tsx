import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { FinancialStatements } from "~/types/financial";
import { getCompanyById } from "~/utils/company.server";
import { calculateFinancialStatements } from "~/utils/financial.server";
import { supabase } from "~/utils/supabase.client";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

type LoaderData = {
  company: {
    id: string;
    name: string;
  };
  financials: FinancialStatements | null;
  startDate: string;
  endDate: string;
  error: string | null;
};

// アクションの戻り値の型を定義
type ActionData = {
  financials: FinancialStatements | null;
  error: string | null;
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
    return redirect("/dashboard");
  }
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") || format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
  const endDate = url.searchParams.get("endDate") || format(new Date(), 'yyyy-MM-dd');
  const { data: financials, error: financialsError } = await calculateFinancialStatements(
    request,
    companyId,
    startDate,
    endDate
  );
  if (financialsError) {
    return json({
      error: "財務諸表の計算に失敗しました",
      company,
      financials: null,
      startDate,
      endDate
    });
  }
  return json({
    company,
    financials,
    error: null,
    startDate,
    endDate
  });
}

// リアルタイム更新用のアクション
export async function action({ request, params }: LoaderFunctionArgs) {
  const companyId = params.id;
  if (!companyId) {
    return json({ error: "会社IDが見つかりません" });
  }
  
  const formData = await request.formData();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  
  const { data: financials, error: financialsError } = await calculateFinancialStatements(
    request,
    companyId,
    startDate,
    endDate
  );
  
  if (financialsError) {
    return json({
      error: "財務諸表の計算に失敗しました",
      financials: null
    });
  }
  
  return json({
    financials,
    error: null
  });
}

export default function Financials() {
  const initialData = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionData>();
  const [selectedStatement, setSelectedStatement] = useState<"pl" | "bs">("pl");
  const [financials, setFinancials] = useState<FinancialStatements | null>(initialData.financials);

  // fetcher.data が更新されたら financials も更新
  useEffect(() => {
    if (fetcher.data?.financials) {
      setFinancials(fetcher.data.financials);
    }
  }, [fetcher.data]);

  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `company_id=eq.${initialData.company.id}`
      }, async (payload) => {
        console.log('Transaction changed:', payload);
        // 変更があったら財務諸表を再計算（サーバー側のアクションを呼び出す）
        fetcher.submit(
          {
            startDate: initialData.startDate,
            endDate: initialData.endDate
          },
          { method: "post" }
        );
      });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [initialData.company.id, initialData.startDate, initialData.endDate, fetcher]);

  if (initialData.error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500">{initialData.error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={() => navigate(`/companies/${initialData.company.id}`)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h3 className="text-lg leading-6 font-medium text-gray-900">財務諸表</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedStatement("pl")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${selectedStatement === "pl" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              損益計算書
            </button>
            <button
              onClick={() => setSelectedStatement("bs")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${selectedStatement === "bs" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              貸借対照表
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">期間</h4>
            <p className="text-sm text-gray-900">
              {format(new Date(initialData.startDate), 'yyyy年MM月dd日', { locale: ja })} 〜 {format(new Date(initialData.endDate), 'yyyy年MM月dd日', { locale: ja })}
            </p>
          </div>
          {selectedStatement === "pl" ? (
            <>
              {/* 損益計算書 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">損益計算書</h3>
                {financials?.incomeStatement.revenues.length === 0 &&
                financials?.incomeStatement.expenses.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">取引データがありません。</p>
                  </div>
                ) : (
                  <>
                    <div>収益: ¥{financials?.incomeStatement.totalRevenue.toLocaleString()}</div>
                    <div>費用: ¥{financials?.incomeStatement.totalExpense.toLocaleString()}</div>
                    <div>当期純利益: ¥{financials?.incomeStatement.netIncome.toLocaleString()}</div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 貸借対照表 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">貸借対照表</h3>
                {financials?.balanceSheet.assets.length === 0 &&
                financials?.balanceSheet.liabilities.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">取引データがありません。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">資産</h4>
                      <div>資産合計: ¥{financials?.balanceSheet.totalAssets.toLocaleString()}</div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">負債・純資産</h4>
                      <div>負債合計: ¥{financials?.balanceSheet.totalLiabilities.toLocaleString()}</div>
                      <div>純資産: ¥{financials?.balanceSheet.totalEquity.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}