// src/components/AuthForm.tsx
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // src/lib/firebase.ts から auth をインポート
import { useRouter } from 'next/navigation'; // ログイン後にリダイレクトするために必要

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // 登録モードかログインモードか
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Next.jsのルーター

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // フォームのデフォルト送信を防ぐ
    setError(null); // エラーメッセージをクリア

    try {
      if (isRegistering) {
        // 新規ユーザー登録
        await createUserWithEmailAndPassword(auth, email, password);
        alert('登録が完了しました！');
      } else {
        // 既存ユーザーログイン
        await signInWithEmailAndPassword(auth, email, password);
        alert('ログインしました！');
      }
      router.push('/main'); // ログインまたは登録が成功したらメインページにリダイレクト
    } catch (err: unknown) {
      console.error('認証エラー:', err);
      let errorMessage = '認証に失敗しました。';

      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: unknown }).code === 'string'
      ) {
        const code = (err as { code: string }).code;

        switch (code) {
          case 'auth/email-already-in-use':
            errorMessage = 'このメールアドレスは既に使用されています。';
            break;
          case 'auth/invalid-email':
            errorMessage = 'メールアドレスの形式が正しくありません。';
            break;
          case 'auth/weak-password':
            errorMessage = 'パスワードが弱すぎます（6文字以上必要です）。';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'メールアドレスまたはパスワードが間違っています。';
            break;
          case 'auth/too-many-requests':
            errorMessage = '何度も失敗したため、一時的にアカウントがロックされました。しばらくしてからお試しください。';
            break;
          default:
            if ('message' in err && typeof err.message === 'string') {
              errorMessage = `認証エラー: ${err.message}`;
            } else {
              errorMessage = '予期せぬエラーが発生しました。';
            }
            break;
        }
      }

      setError(errorMessage);
    }

  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isRegistering ? '新規登録' : 'ログイン'}
        </h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              required
              minLength={6} // Firebaseのパスワード最小要件
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            {isRegistering ? '登録' : 'ログイン'}
          </button>
        </form>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-4 text-blue-500 hover:underline text-sm w-full"
        >
          {isRegistering ? 'アカウントをお持ちの方はこちら (ログイン)' : 'アカウントをお持ちでない方はこちら (新規登録)'}
        </button>
      </div>
    </div>
  );
}