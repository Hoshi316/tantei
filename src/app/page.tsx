// src/app/page.tsx
'use client'

import Link from 'next/link'
import CaseNotebook from '@/components/CaseNotebook' // CaseNotebookをインポート
import SettingsModal from '@/components/SettingsModal'; // ★★★ SettingsModalをインポート ★★★
import { useState } from 'react'; // ★★★ useStateをインポート（もし既にないなら） ★★★


export default function WelcomePage() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  return (
    <main
  className="min-h-screen p-4 flex flex-col items-center relative font-sans bg-cover bg-center"
  style={{ backgroundImage: "url('homedesk.jpg')" }}
>
     

          <div className="max-w-screen-md w-full text-center
                      flex flex-col items-center justify-start pt-20
                      md:justify-center md:pt-0"> {/* justify-start と pt-20 を追加、md:で戻す */}

        <p className="text-xl text-gray-700 mb-10 max-w-4xl text-white mx-auto">
          怪盗に隠されたものを探すため、助手と一緒に事件を整理していきましょう！
        </p>
        
         <button
          onClick={() => setShowSettingsModal(true)}
          className="absolute top-4 left-4 bg-gray-200 text-gray-700 px-3 py-1 rounded-full shadow hover:bg-gray-300 text-sm z-30"
        >
          ⚙️ 設定
        </button>

        {/* ボタン群のコンテナ */}
        <div className="flex flex-col gap-8 mb-12 items-center">
          {/* 「調査を開始する」ボタン (Linkとして機能) */}
          <Link href="/main" className="inline-block bg-blue-600 text-white text-xl font-bold px-12 py-10 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
            調査を開始する
          </Link>

          {/* 事件簿を見るボタン (CaseNotebookコンポーネントが提供) */}
          {/* CaseNotebookコンポーネント内のボタンがfixedでない場合、ここに配置されます */}
          <CaseNotebook />
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>&copy; 2025 Lost Finder App</p>
        </div>
      </div>

            {/* ★★★ SettingsModal を呼び出す ★★★ */}
      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      
    </main>
  )
}