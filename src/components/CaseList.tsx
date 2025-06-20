'use client'
import {CaseData} from '@/types/case';
export default function CaseList({ cases }: { cases: CaseData[] }) {
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
                {c.foundLocation && <li>🧭 見つけた場所：{c.foundLocation}</li>}
                {c.foundMemo && <li>📝 メモ：{c.foundMemo}</li>}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
