'use client'

import { useEffect, useState } from 'react'
import { CaseData } from '@/types/case';

export default function CaseAnalysis({ cases }: { cases: CaseData[] }) {
  const [summary, setSummary] = useState<string | null>(null)

  const lostItems = cases.map(c => c.answers?.[0]).filter(Boolean)
  const foundPlaces = cases.map(c => c.foundLocation).filter(Boolean)

  const count = (arr: string[]) =>
    arr.reduce((acc, cur) => {
      acc[cur] = (acc[cur] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const filteredLostItems: string[] = lostItems.filter((item): item is string => item !== undefined);
  const itemStats = count(filteredLostItems);
  const filteredFoundPlaces: string[] = foundPlaces.filter((place): place is string => place !== undefined);
  const placeStats = count(filteredFoundPlaces);

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cases })
      })
      const data = await res.json()
      setSummary(data.summary)
    }

    fetchSummary()
  }, [cases])

  return (
    <div className="text-sm space-y-4">
      <div>
        <h3 className="font-bold text-lg">🧾 よく失くすもの</h3>
        <ul className="list-disc list-inside">
          {Object.entries(itemStats).map(([item, count]) => (
            <li key={item}>{item}：{count}回</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-bold text-lg">📍 見つかる場所</h3>
        <ul className="list-disc list-inside">
          {Object.entries(placeStats).map(([place, count]) => (
            <li key={place}>{place}：{count}回</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-bold text-lg">🧠 助手の分析コメント</h3>
        {summary ? (
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{summary}</p>
        ) : (
          <p className="text-gray-400">読み込み中...</p>
        )}
      </div>
    </div>
  )
}
