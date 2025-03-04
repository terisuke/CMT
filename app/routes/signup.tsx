import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';

export default function Signup() {
  const navigate = useNavigate();

  useEffect(() => {
    // インデックスページのサインアップタブにリダイレクト
    navigate('/?signup=true');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl text-gray-800 font-bold">事業再生コンサルタントツール</h1>
            <p className="text-gray-600 mt-2">リダイレクト中...</p>
          </div>
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-300 text-center">
            <div className="animate-pulse flex flex-col items-center justify-center">
              <div className="h-8 w-8 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">サインアップページに移動中...</p>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-white shadow-inner py-3 px-4">
        <div className="w-full mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} 事業再生コンサルタントツール
        </div>
      </footer>
    </div>
  );
}