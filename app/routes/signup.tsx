import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { supabase } from '~/utils/supabase.client';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // クライアント側でのサインアップ処理
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // プロフィール作成はサインアップ時にトリガーされるサーバー側の関数で行うことを前提
      if (data.user) {
        // サインアップ成功
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'サインアップに失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-gray-800 font-bold">事業再生コンサルタントツール</h1>
          <p className="text-gray-600 mt-2">新規登録</p>
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-sm">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
              >
                {loading ? '登録中...' : '新規登録'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ログインページに戻る
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}