/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from "~/types/database";
import { createServerSupabaseClient } from "./supabase.server";

// ユーザーに関連付けられた企業一覧を取得
// 戻り値の型をany[]として定義し、TypeScriptのエラーを回避
export async function getUserCompanies(request: Request, userId: string): Promise<{ data: any[] | null, error: any }> {
  const supabaseClient = createServerSupabaseClient(request);

  // user_companiesテーブルとcompaniesテーブルを結合して取得
  const response = await supabaseClient
    .from('user_companies')
    .select(`
      id,
      role,
      companies (
        id,
        name,
        business_type,
        established_date,
        representative,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log("Raw API response:", JSON.stringify(response, null, 2));
  
  return response;
}

// 企業の詳細情報を取得
export async function getCompanyById(request: Request, companyId: string) {
  const supabaseClient = createServerSupabaseClient(request);

  const { data, error } = await supabaseClient
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  return { data, error };
}

// 新しい企業を作成し、ユーザーと関連付ける
export async function createCompany(
  request: Request,
  userId: string,
  companyData: Database['public']['Tables']['companies']['Insert']
) {
  const supabaseClient = createServerSupabaseClient(request);

  // 企業を作成
  console.log("企業作成開始", companyData);
  const { data: company, error: companyError } = await supabaseClient
    .from('companies')
    .insert({
      ...companyData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  console.log("企業作成結果", { company, error: companyError });

  if (companyError || !company) {
    return { error: companyError };
  }

  // ユーザーと企業を関連付ける
  console.log("関連付け開始", { userId, companyId: company.id });
  const { error: relationError } = await supabaseClient
    .from('user_companies')
    .insert({
      user_id: userId,
      company_id: company.id,
      role: 'owner',
      created_at: new Date().toISOString(),
    });

  console.log("関連付け結果", { error: relationError });

  return { data: company, error: relationError };
}