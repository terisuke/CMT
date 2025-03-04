import { useNavigate } from '@remix-run/react';
import { ReactNode } from 'react';
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">{title}</h1>
            <div className="flex items-center gap-4">
              {showBackButton ? (
                <button
                  onClick={() => navigate(backTo)}
                  className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  戻る
                </button>
              ) : (
                <>
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <button
                    onClick={signOut}
                    className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    ログアウト
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <div className="flex-grow flex flex-col h-full">
            {children}
          </div>
        </main>

        <footer className="bg-white shadow-inner py-3 px-4 mt-auto">
          <div className="w-full mx-auto text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 事業再生コンサルタントツール
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}