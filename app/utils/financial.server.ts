/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from "./supabase.server";
import type { AccountSummary, FinancialStatements } from "~/types/financial";

// 取引データから財務諸表を計算する
export async function calculateFinancialStatements(
  request: Request,
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: FinancialStatements | null; error: any }> {
  const supabase = createServerSupabaseClient(request);
  
  // デフォルトの期間を設定（startDateが指定されていない場合は当年の1月1日、endDateが指定されていない場合は現在日）
  const today = new Date();
  const defaultStartDate = `${today.getFullYear()}-01-01`;
  const defaultEndDate = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
  
  // 期間を設定
  const period = {
    startDate: startDate || defaultStartDate,
    endDate: endDate || defaultEndDate,
  };
  
  // 期間内の取引データを取得
  const query = supabase
    .from('transactions')
    .select('*')
    .eq('company_id', companyId)
    .gte('date', period.startDate)
    .lte('date', period.endDate)
    .order('date', { ascending: true });
  
  const { data: transactions, error } = await query;
  
  if (error) {
    return { data: null, error };
  }
  
  // 財務諸表の初期値を設定
  const financialStatements: FinancialStatements = {
    balanceSheet: {
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    },
    incomeStatement: {
      revenues: [],
      expenses: [],
      totalRevenue: 0,
      totalExpense: 0,
      netIncome: 0,
    },
    period,
  };
  
  // 勘定科目別に集計
  const accountSummaries: Record<string, { amount: number; type: string }> = {};
  
  // 取引データを集計
  transactions?.forEach((transaction) => {
    // 既存の勘定科目があればその金額を加算、なければ新しく追加
    if (accountSummaries[transaction.account]) {
      accountSummaries[transaction.account].amount += transaction.amount;
    } else {
      accountSummaries[transaction.account] = {
        amount: transaction.amount,
        type: transaction.type,
      };
    }
  });
  
  // 資産の合計を計算
  const assets: AccountSummary[] = Object.entries(accountSummaries)
    .filter(([_, value]) => value.type === 'asset')
    .map(([account, { amount }]) => ({ account, amount }));
  
  // 負債の合計を計算
  const liabilities: AccountSummary[] = Object.entries(accountSummaries)
    .filter(([_, value]) => value.type === 'liability')
    .map(([account, { amount }]) => ({ account, amount }));
  
  // 収益の合計を計算
  const revenues: AccountSummary[] = Object.entries(accountSummaries)
    .filter(([_, value]) => value.type === 'income')
    .map(([account, { amount }]) => ({ account, amount }));
  
  // 費用の合計を計算
  const expenses: AccountSummary[] = Object.entries(accountSummaries)
    .filter(([_, value]) => value.type === 'expense')
    .map(([account, { amount }]) => ({ account, amount }));
  
  // 合計金額を計算
  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpense;
  
  // 純資産（資本）を計算（純資産 = 資産 - 負債）
  const totalEquity = totalAssets - totalLiabilities;
  
  // 純資産（資本）の項目を作成
  const equity: AccountSummary[] = [
    { account: '純利益', amount: netIncome },
  ];
  
  // 財務諸表に計算結果を設定
  financialStatements.balanceSheet.assets = assets;
  financialStatements.balanceSheet.liabilities = liabilities;
  financialStatements.balanceSheet.equity = equity;
  financialStatements.balanceSheet.totalAssets = totalAssets;
  financialStatements.balanceSheet.totalLiabilities = totalLiabilities;
  financialStatements.balanceSheet.totalEquity = totalEquity;
  
  financialStatements.incomeStatement.revenues = revenues;
  financialStatements.incomeStatement.expenses = expenses;
  financialStatements.incomeStatement.totalRevenue = totalRevenue;
  financialStatements.incomeStatement.totalExpense = totalExpense;
  financialStatements.incomeStatement.netIncome = netIncome;
  
  return { data: financialStatements, error: null };
}

// 財務指標を計算する関数
export async function calculateFinancialMetrics(
  currentPeriodStatements: FinancialStatements,
  previousPeriodStatements?: FinancialStatements
) {
  // 現在期間の財務指標
  const currentMetrics = {
    totalRevenue: currentPeriodStatements.incomeStatement.totalRevenue,
    totalExpense: currentPeriodStatements.incomeStatement.totalExpense,
    netIncome: currentPeriodStatements.incomeStatement.netIncome,
    totalAssets: currentPeriodStatements.balanceSheet.totalAssets,
    totalLiabilities: currentPeriodStatements.balanceSheet.totalLiabilities,
    equity: currentPeriodStatements.balanceSheet.totalEquity,
  };
  
  // 前期がない場合は成長率なしで返す
  if (!previousPeriodStatements) {
    return {
      currentPeriod: currentMetrics,
      ratios: {
        profitMargin: currentMetrics.totalRevenue ? (currentMetrics.netIncome / currentMetrics.totalRevenue) * 100 : 0,
        returnOnAssets: currentMetrics.totalAssets ? (currentMetrics.netIncome / currentMetrics.totalAssets) * 100 : 0,
        debtToEquity: currentMetrics.equity ? (currentMetrics.totalLiabilities / currentMetrics.equity) : 0,
      }
    };
  }
  
  // 前期の財務指標
  const previousMetrics = {
    totalRevenue: previousPeriodStatements.incomeStatement.totalRevenue,
    totalExpense: previousPeriodStatements.incomeStatement.totalExpense,
    netIncome: previousPeriodStatements.incomeStatement.netIncome,
    totalAssets: previousPeriodStatements.balanceSheet.totalAssets,
    totalLiabilities: previousPeriodStatements.balanceSheet.totalLiabilities,
    equity: previousPeriodStatements.balanceSheet.totalEquity,
  };
  
  // 成長率を計算
  const growth = {
    revenueGrowth: previousMetrics.totalRevenue 
      ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100 
      : 0,
    expenseGrowth: previousMetrics.totalExpense 
      ? ((currentMetrics.totalExpense - previousMetrics.totalExpense) / previousMetrics.totalExpense) * 100 
      : 0,
    netIncomeGrowth: previousMetrics.netIncome 
      ? ((currentMetrics.netIncome - previousMetrics.netIncome) / previousMetrics.netIncome) * 100 
      : 0,
    assetGrowth: previousMetrics.totalAssets 
      ? ((currentMetrics.totalAssets - previousMetrics.totalAssets) / previousMetrics.totalAssets) * 100 
      : 0,
  };
  
  // 財務比率を計算
  const ratios = {
    profitMargin: currentMetrics.totalRevenue ? (currentMetrics.netIncome / currentMetrics.totalRevenue) * 100 : 0,
    returnOnAssets: currentMetrics.totalAssets ? (currentMetrics.netIncome / currentMetrics.totalAssets) * 100 : 0,
    debtToEquity: currentMetrics.equity ? (currentMetrics.totalLiabilities / currentMetrics.equity) : 0,
  };
  
  return {
    currentPeriod: currentMetrics,
    previousPeriod: previousMetrics,
    growth,
    ratios,
  };
}