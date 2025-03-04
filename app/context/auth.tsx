import { User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '~/utils/supabase.client';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッションの初期化
    const initSession = async () => {
      // getUser()メソッドを使用して認証済みユーザー情報を取得
      const { data, error } = await supabase.auth.getUser();
      
      if (!error && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
      
      setLoading(false);

      // 認証状態の変更を監視
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            // 認証状態が変更された場合も、getUser()で確認
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initSession();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}