// src/components/CaseNotebook.tsx
'use client'

import { useState, useEffect } from "react"
import CaseList from "./CaseList"
import CaseAnalysis from "./CaseAnalysis"
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { CaseData } from '@/types/case';
import Image from 'next/image'

export default function CaseNotebook() { // ★★★ propsからcasesを削除 ★★★
  const [activePage, setActivePage] = useState<'list' | 'analysis'>('list')
  const [showNotebook, setShowNotebook] = useState(false) // モーダルの表示状態
  const [cases, setCases] = useState<CaseData[]>([]) // ★★★ データをここで管理 ★★★
  const [loadingCases, setLoadingCases] = useState(false)

  useEffect(() => {
    const fetchCases = async () => {
      setLoadingCases(true)
      try {
        const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        const items = snapshot.docs.map(doc => doc.data() as CaseData)
        setCases(items)
      } catch (error) {
        console.error('事件簿データの取得に失敗しました:', error)
      } finally {
        setLoadingCases(false)
      }
    }

    if (showNotebook) {
      fetchCases() // showNotebook が true になったらデータをフェッチ
    }
  }, [showNotebook])

  return (
    <>
      {/* ★★★ 事件簿を開く画像ボタン ★★★ */}
      <button
        onClick={() => setShowNotebook(true)} // モーダル表示を制御
        className="inline-block bg-transparent border-0 p-0 shadow-none hover:opacity-80 transition-opacity duration-300"
        aria-label="事件簿を開く"
      >
        <Image
          src="/file.PNG"
          alt="事件簿を開く"
          width={160} // md:w-40 に相当（40×4 = 160px）
          height={160} // 高さは適当でOK。画像のアスペクト比に合わせて調整される
          className="w-24 h-auto md:w-40"
          priority
        />

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