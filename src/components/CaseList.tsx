'use client'
import { useState } from 'react'
import { CaseData } from '@/types/case'
import FoundModal from '@/app/components/FoundModal'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'  // dbをインポート（必要に応じてパス調整）

export default function CaseList({ cases }: { cases: CaseData[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const handleFoundClick = (id: string) => {
    setSelectedCaseId(id)
    setModalOpen(true)
  }

  const handleSave = async (location: string, memo: string) => {
    if (!selectedCaseId) return
    const ref = doc(db, 'cases', selectedCaseId)
    await updateDoc(ref, {
      status: 'resolved',
      foundLocation: location,
      foundMemo: memo,
    })
    setModalOpen(false)
    setSelectedCaseId(null)
  }

    return (
    <div className="space-y-4 text-sm">
      {cases.length === 0 ? (
        <p className="text-gray-600">事件簿はまだありません。</p>
      ) : (
        <ul className="space-y-4">
          {cases.map((c, idx) => (
            <li key={idx} className="border p-3 rounded shadow">
              <p className="text-xs text-gray-500">
                {new Date(c.createdAt?.seconds * 1000).toLocaleString()}
              </p>
              <ul className="list-disc ml-5 mt-1 text-gray-800">
                {c.answers?.map((a: string, i: number) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>

              <div className="mt-2">
                <button
                  onClick={() => handleFoundClick(c.id)}
                  className="text-sm text-blue-600 underline hover:text-blue-800"
                >
                  見つけた！
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* モーダルをここに配置 */}
      <FoundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
