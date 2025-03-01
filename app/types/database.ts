export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          role: 'user' | 'manager';
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          role?: 'user' | 'manager';
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          role?: 'user' | 'manager';
          created_at?: string;
          updated_at?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          business_type: string | null;
          established_date: string | null;
          representative: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          business_type?: string | null;
          established_date?: string | null;
          representative?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          business_type?: string | null;
          established_date?: string | null;
          representative?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      user_companies: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role: 'owner' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role?: 'owner' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role?: 'owner' | 'member';
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          company_id: string;
          date: string;
          account: string;
          description: string | null;
          amount: number;
          type: 'income' | 'expense' | 'asset' | 'liability';
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          date: string;
          account: string;
          description?: string | null;
          amount: number;
          type: 'income' | 'expense' | 'asset' | 'liability';
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          date?: string;
          account?: string;
          description?: string | null;
          amount?: number;
          type?: 'income' | 'expense' | 'asset' | 'liability';
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
}