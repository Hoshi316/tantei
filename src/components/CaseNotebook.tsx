// src/components/CaseNotebook.tsx
'use client'

import { useState, useEffect } from "react"
import CaseList from "./CaseList"
import CaseAnalysis from "./CaseAnalysis"
import { db } from '@/lib/firebase'
import { collection, query, orderBy} from 'firebase/firestore'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext' // 追加
import { CaseData } from '@/types/case';
import Image from 'next/image'

export default function CaseNotebook() { // ★★★ propsからcasesを削除 ★★★
  const { user } = useAuth() // 追加
  const [activePage, setActivePage] = useState<'list' | 'analysis'>('list')
  const [showNotebook, setShowNotebook] = useState(false) // モーダルの表示状態
  const [cases, setCases] = useState<CaseData[]>([]) // ★★★ データをここで管理 ★★★
  const [loadingCases, setLoadingCases] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined; // onSnapshotの返り値はクリーンアップ関数

    if (showNotebook && user) { // モーダルが開いていて、ユーザーがログインしている場合のみ
      setLoadingCases(true); // ロード開始

      const q = query(
        collection(db, 'users', user.uid, 'cases'), // users/{userId}/cases に保存されているはず
        orderBy('createdAt', 'desc')
      );

      // onSnapshot でリアルタイムリスナーを設定
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as CaseData);
        setCases(items);
        setLoadingCases(false); // データ取得完了
      }, (error) => {
        console.error('事件簿データのリアルタイム取得失敗:', error);
        setLoadingCases(false); // エラー時もロード完了
      });
    }

    // クリーンアップ関数: コンポーネントがアンマウントされるか、依存配列が変わる前にリスナーを停止
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showNotebook, user]);


  return (
    <>
   {/* 事件簿を開く画像ボタン */}
      <button
        onClick={() => setShowNotebook(true)}
        className="fixed bottom-24 right-6 bg-transparent border-0 p-0 shadow-none hover:opacity-80 transition-opacity duration-300 z-40"
        aria-label="事件簿を開く"
      >
        {/* ★★★ ここを修正 ★★★ */}
        {/* Image コンポーネントの親にサイズを定義し、Imageには fill を使う */}
        <div className="relative w-60 h-60 md:w-110 md:h-110"> {/* ★親のdivにレスポンシブサイズを定義★ */}
            <Image
                src="/file.PNG"
                alt="事件簿を開く"
                fill // ★★★ fill プロパティを追加 ★★★
                className="object-contain" // ★★★ object-contain を追加して画像がdivに収まるように ★★★
                priority
                // width, height, className="w-..." は全てここから削除
                // sizes属性も不要になる
            />
        </div>
      </button>

      {/* 事件簿一覧/分析のモーダル */}
      {showNotebook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative bg-white p-6 rounded-lg w-[700px] h-[500px] shadow-lg font-sans">
            {/* 閉じるボタン */}
             <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl z-50" // ★★★ z-50 を追加して一番上にする ★★★
              onClick={() => setShowNotebook(false)}
            >
              ×
            </button>

            {/* 左：中身 */}
            <div className="w-full h-full overflow-y-auto pr-20">
              {loadingCases ? (
                  <p className="text-gray-600">事件簿を読み込み中...</p>
              ) : (
                  <>
                      {activePage === 'list' && <CaseList cases={cases} />}
                      {activePage === 'analysis' && <CaseAnalysis cases={cases} />}
                  </>
              )}
            </div>

            {/* 右：付箋タブ */}
            <div className="absolute top-0 right-0 h-full flex flex-col justify-center space-y-2 pr-2">
              <button
                onClick={() => setActivePage('list')}
                className={`bg-yellow-300 px-2 py-1 rounded-l shadow hover:bg-yellow-400 text-sm ${activePage === 'list' ? 'font-bold' : ''}`}
              >
                📄 一覧
              </button>
              <button
                onClick={() => setActivePage('analysis')}
                className={`bg-green-300 px-2 py-1 rounded-l shadow hover:bg-green-400 text-sm ${activePage === 'analysis' ? 'font-bold' : ''}`}
              >
                📊 分析
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}