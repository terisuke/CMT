import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';

export default function Signup() {
  const navigate = useNavigate();

  useEffect(() => {
    // インデックスページのサインアップタブにリダイレクト
    navigate('/?signup=true');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-gray-800 font-bold">事業再生コンサルタントツール</h1>
          <p className="text-gray-600 mt-2">リダイレクト中...</p>
        </div>
      </div>
    </div>
  );
}