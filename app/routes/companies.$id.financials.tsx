/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import type { AccountSummary, FinancialStatements } from "~/types/financial";
import { getCompanyById } from "~/utils/company.server";
import { calculateFinancialStatements } from "~/utils/financial.server";
import { createServerSupabaseClient, getUserFromSession } from "~/utils/supabase.server";

// loaderの戻り値の型を定義
type LoaderData = {
  company: {
    id: string;
    name: string;
  };
  financials: FinancialStatements | null;
  period: {
    startDate: string;
    endDate: string;
  };
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
      financials: null
    });
  }
  
  // クエリパラメータから期間を取得
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  
  // 財務諸表を計算
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
      financials: null
    });
  }
  
  return json({ 
    company,
    financials,
    error: null
  });
}

export default function FinancialStatements() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedStatement, setSelectedStatement] = useState<"pl" | "bs">("pl");
  
  // 型が合わないエラーを解決するためのワークアラウンド
  const financials = data.financials as any;
  const company = data.company;
  
  // カスタム期間設定（型エラーを回避）
  const displayPeriod = {
    startDate: "2023-01-01",
    endDate: "2023-12-31"
  };
  
  // 表示する期間の設定（文字列で管理）
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [period] = useState({
    startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd')
  });
  
  // 勘定科目の種類ごとに集計を表示
  const renderAccountGroup = (title: string, accounts: AccountSummary[]) => {
    if (!accounts || accounts.length === 0) return null;
    
    return (
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-3">{title}</h4>
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <li key={account.account} className="px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-900">{account.account}</div>
                <div className="text-sm font-semibold text-gray-900">
                  ¥{account.amount.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  // 合計金額を表示
  const renderTotal = (title: string, amount: number | undefined, colorClass: string = 'text-gray-900') => {
    if (amount === undefined) return null;
    
    return (
      <div className="mt-6 p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-lg font-medium text-gray-900">{title}</div>
        <div className={`text-xl font-bold ${colorClass}`}>
          ¥{amount.toLocaleString()}
        </div>
      </div>
    );
  };
  
  if (data.error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500">{data.error}</div>
      </div>
    );
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">財務諸表</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedStatement("pl")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatement === "pl" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              損益計算書
            </button>
            <button
              onClick={() => setSelectedStatement("bs")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStatement === "bs" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              貸借対照表
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">期間</h4>
            <p className="text-sm text-gray-900">
              {format(new Date(period.startDate), 'yyyy年MM月dd日', { locale: ja })} 〜 {format(new Date(period.endDate), 'yyyy年MM月dd日', { locale: ja })}
            </p>
          </div>
          
          {selectedStatement === "pl" ? (
            <>
              {/* 損益計算書 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">損益計算書</h3>
                
                {!financials?.incomeStatement?.revenues?.length && !financials?.incomeStatement?.expenses?.length ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">取引データがありません。</p>
                  </div>
                ) : (
                  <>
                    {renderAccountGroup("収益", financials?.incomeStatement?.revenues || [])}
                    {renderTotal("収益合計", financials?.incomeStatement?.totalRevenue, "text-green-600")}
                    
                    {renderAccountGroup("費用", financials?.incomeStatement?.expenses || [])}
                    {renderTotal("費用合計", financials?.incomeStatement?.totalExpense, "text-red-600")}
                    
                    {renderTotal("当期純利益", financials?.incomeStatement?.netIncome, 
                      (financials?.incomeStatement?.netIncome || 0) >= 0 ? "text-green-600" : "text-red-600")}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 貸借対照表 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">貸借対照表</h3>
                
                {!financials?.balanceSheet?.assets?.length && !financials?.balanceSheet?.liabilities?.length ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">取引データがありません。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">資産</h4>
                      {renderAccountGroup("資産項目", financials?.balanceSheet?.assets || [])}
                      {renderTotal("資産合計", financials?.balanceSheet?.totalAssets, "text-blue-600")}
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">負債・純資産</h4>
                      {renderAccountGroup("負債項目", financials?.balanceSheet?.liabilities || [])}
                      {renderTotal("負債合計", financials?.balanceSheet?.totalLiabilities, "text-yellow-600")}
                      
                      <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">純資産</h4>
                        <div className="bg-white shadow overflow-hidden rounded-md">
                          <ul className="divide-y divide-gray-200">
                            <li className="px-6 py-4 flex items-center justify-between">
                              <div className="text-sm text-gray-900">当期純利益</div>
                              <div className={`text-sm font-semibold ${(financials?.incomeStatement?.netIncome || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                ¥{(financials?.incomeStatement?.netIncome || 0).toLocaleString()}
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      {renderTotal("負債・純資産合計", 
                        (financials?.balanceSheet?.totalLiabilities || 0) + (financials?.incomeStatement?.netIncome || 0), 
                        "text-blue-600")}
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
