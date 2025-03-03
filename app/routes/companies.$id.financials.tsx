import { useState } from "react";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import AppLayout from "~/components/AppLayout";
import { createServerSupabaseClient } from "~/utils/supabase.server";
import { getCompanyById } from "~/utils/company.server";
import { calculateFinancialStatements } from "~/utils/financial.server";
import type { FinancialStatements, AccountSummary } from "~/types/financial";

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
  const { company, financials, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'balance' | 'income'>('balance');
  
  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日', { locale: ja });
  };
  
  // 金額をフォーマットする関数
  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + ' 円';
  };
  
  // 財務諸表セクションのレンダリング
  const renderAccountList = (items: AccountSummary[]) => {
    if (items.length === 0) {
      return <p className="text-gray-500 py-2">データがありません</p>;
    }
    
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-800">{item.account}</span>
            <span className="font-medium">{formatAmount(item.amount)}</span>
          </div>
        ))}
      </div>
    );
  };
  
  if (error) {
    return (
      <AppLayout 
        title={company ? `${company.name} - エラー` : "エラー"} 
        showBackButton={true} 
        backTo={company ? `/companies/${company.id}` : "/dashboard"}
      >
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      </AppLayout>
    );
  }
  
  if (!financials) {
    return (
      <AppLayout 
        title={`${company?.name} - 財務諸表`} 
        showBackButton={true} 
        backTo={`/companies/${company?.id}`}
      >
        <div className="bg-yellow-50 p-4 rounded-md mb-6">
          <p className="text-yellow-600">財務データがありません。取引を登録してください。</p>
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(`/companies/${company?.id}/transactions`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            取引管理へ
          </button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout 
      title={`${company?.name} - 財務諸表`} 
      showBackButton={true} 
      backTo={`/companies/${company?.id}`}
    >
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            財務諸表（{formatDate(financials.period.startDate)} 〜 {formatDate(financials.period.endDate)}）
          </h3>
        </div>
        
        {/* タブ切り替え */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'balance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              貸借対照表
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'income'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              損益計算書
            </button>
          </nav>
        </div>
        
        {/* 財務諸表の内容 */}
        <div className="p-6">
          {activeTab === 'balance' ? (
            <div className="space-y-8">
              {/* 資産 */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">資産</h4>
                {renderAccountList(financials.balanceSheet.assets)}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-200 font-bold">
                  <span>資産合計</span>
                  <span>{formatAmount(financials.balanceSheet.totalAssets)}</span>
                </div>
              </div>
              
              {/* 負債 */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">負債</h4>
                {renderAccountList(financials.balanceSheet.liabilities)}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-200 font-bold">
                  <span>負債合計</span>
                  <span>{formatAmount(financials.balanceSheet.totalLiabilities)}</span>
                </div>
              </div>
              
              {/* 純資産 */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">純資産</h4>
                {renderAccountList(financials.balanceSheet.equity)}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-200 font-bold">
                  <span>純資産合計</span>
                  <span>{formatAmount(financials.balanceSheet.totalEquity)}</span>
                </div>
              </div>
              
              {/* 貸借チェック */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between font-bold">
                  <span>資産合計</span>
                  <span>{formatAmount(financials.balanceSheet.totalAssets)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2">
                  <span>負債・純資産合計</span>
                  <span>
                    {formatAmount(financials.balanceSheet.totalLiabilities + financials.balanceSheet.totalEquity)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 収益 */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">収益</h4>
                {renderAccountList(financials.incomeStatement.revenues)}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-200 font-bold">
                  <span>収益合計</span>
                  <span>{formatAmount(financials.incomeStatement.totalRevenue)}</span>
                </div>
              </div>
              
              {/* 費用 */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">費用</h4>
                {renderAccountList(financials.incomeStatement.expenses)}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-200 font-bold">
                  <span>費用合計</span>
                  <span>{formatAmount(financials.incomeStatement.totalExpense)}</span>
                </div>
              </div>
              
              {/* 純利益 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between font-bold text-lg">
                  <span>純利益</span>
                  <span className={financials.incomeStatement.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}>
                    {formatAmount(financials.incomeStatement.netIncome)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* ボタン */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => navigate(`/companies/${company?.id}/transactions`)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            取引一覧へ
          </button>
        </div>
      </div>
    </AppLayout>
  );
}