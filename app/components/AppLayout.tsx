import { ReactNode } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/context/auth';
import AuthGuard from './AuthGuard';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
}

export default function AppLayout({ 
  children, 
  title = '事業再生コンサルタントツール',
  showBackButton = false,
  backTo = '/dashboard'
}: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            <div className="flex items-center gap-4">
              {showBackButton ? (
                <button
                  onClick={() => navigate(backTo)}
                  className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                >
                  戻る
                </button>
              ) : (
                <>
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <button
                    onClick={signOut}
                    className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                  >
                    ログアウト
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}