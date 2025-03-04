import { createServerSupabaseClient } from "./supabase.server";

export async function getTransactionsByCompanyId(request: Request, companyId: string) {
  const supabase = createServerSupabaseClient(request);
  
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("company_id", companyId)
    .order("date", { ascending: false });
    
  if (error) {
    console.error("Error fetching transactions:", error);
    return { data: [], error };
  }
  
  return { data: data || [], error: null };
}

export async function getTransactionById(request: Request, transactionId: string) {
  const supabase = createServerSupabaseClient(request);
  
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .single();
    
  if (error) {
    console.error("Error fetching transaction:", error);
    return { data: null, error };
  }
  
  return { data, error: null };
}

export async function createTransaction(request: Request, transactionData: {
  company_id: string;
  date: string;
  account: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense' | 'asset' | 'liability';
}) {
  const supabase = createServerSupabaseClient(request);
  
  const { data, error } = await supabase
    .from("transactions")
    .insert([transactionData])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating transaction:", error);
    return { data: null, error };
  }
  
  return { data, error: null };
}

export async function updateTransaction(
  request: Request,
  transactionId: string,
  transactionData: Partial<{
    date: string;
    account: string;
    description: string | null;
    amount: number;
    type: 'income' | 'expense' | 'asset' | 'liability';
  }>
) {
  const supabase = createServerSupabaseClient(request);
  
  const { data, error } = await supabase
    .from("transactions")
    .update(transactionData)
    .eq("id", transactionId)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating transaction:", error);
    return { data: null, error };
  }
  
  return { data, error: null };
}

export async function deleteTransaction(request: Request, transactionId: string) {
  const supabase = createServerSupabaseClient(request);
  
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);
    
  if (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
} 