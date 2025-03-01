import { useAuth } from '~/context/auth';
import AuthGuard from '~/components/AuthGuard';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">事業再生コンサルタントツール</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">ダッシュボード</h2>
            <p className="text-gray-600">
              登録されている企業がここに表示されます。企業を追加するには「企業を追加」ボタンをクリックしてください。
            </p>
            
            <div className="mt-6">
              {/* ここに企業一覧を表示 */}
              <p className="text-gray-500 italic">企業データがまだありません。</p>
              
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                企業を追加
              </button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}