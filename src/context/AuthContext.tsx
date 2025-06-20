// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth'; // 'getAuth' はここから不要です
import { getFirebaseAuth } from '@/lib/firebase'; // ★★★ auth ではなく getFirebaseAuth をインポート ★★★

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ★★★ getFirebaseAuth() を呼び出して認証インスタンスを取得 ★★★
    const authInstance = getFirebaseAuth(); 
    
    // authInstance が存在する場合（クライアントサイドの場合）のみ認証状態を監視
    if (authInstance) { 
      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // サーバーサイドなど、authInstance が取得できない場合はローディングを終了
      setLoading(false);
    }
  }, []); // 依存配列は空のままで問題ありません

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};