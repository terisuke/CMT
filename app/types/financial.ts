// 勘定科目のカテゴリ
export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// 財務諸表計算結果の型
export interface FinancialStatements {
  // 貸借対照表
  balanceSheet: {
    assets: AccountSummary[];
    liabilities: AccountSummary[];
    equity: AccountSummary[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  
  // 損益計算書
  incomeStatement: {
    revenues: AccountSummary[];
    expenses: AccountSummary[];
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
  };
  
  // 期間
  period: {
    startDate: string;
    endDate: string;
  };
}

// 勘定科目の集計結果
export interface AccountSummary {
  account: string;
  amount: number;
}

// 前期比較用の財務指標
export interface FinancialMetrics {
  currentPeriod: {
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
  };
  previousPeriod?: {
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
  };
  // 成長率や比率
  growth?: {
    revenueGrowth: number;
    expenseGrowth: number;
    netIncomeGrowth: number;
    assetGrowth: number;
  };
  // 財務比率
  ratios: {
    profitMargin: number;
    returnOnAssets: number;
    debtToEquity: number;
    currentRatio?: number;
  };
}