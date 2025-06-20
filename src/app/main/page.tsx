// src/app/main/page.tsx
'use client'

import { useState, useEffect } from 'react' // useRef をインポート
import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import FoundModal from '../components/FoundModal'
import CaseNotebook from '@/components/CaseNotebook'
import Link from 'next/link'

const questions = [
  '何を失くしましたか？',
  '最後に見たのはいつですか？',
  '最後に見た場所はどこですか？',
  '普段はどこに置いてありますか？',
  '最後にその物を使ったのは何をしていた時ですか？',
  '一緒にいた人や他の物はありますか？',
  'どこを探しましたか？'
]

export default function MainAppPage() {
  const [assistantFace, setAssistantFace] = useState('/assistant-default.png')

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [input, setInput] = useState('')

  const [suggestion, setSuggestion] = useState<string | null>(null) // アドバイス取得中用
  const [loadingAdvice, setLoadingAdvice] = useState(false)

  const [showFoundModal, setShowFoundModal] = useState(false)

 
  const [conversation, setConversation] = useState<
    { type: 'question' | 'advice' | 'completion', text: string } | null
  >(null); 

  const handleSubmit = async () => {
    if (!input.trim()) return

    const newAnswers = [...answers, input]
    setAnswers(newAnswers)

    let currentReaction = ''
    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: input })
      })
      const data = await res.json()
      currentReaction = data.reaction
    } catch (err) {
      currentReaction = '…なるほど、' // APIエラー時のデフォルトリアクション
    }

    // ユーザーの入力テキスト（リアクション）は会話履歴には追加しない

    setInput('');
    const nextStep = step + 1;

  // ★★★ 次の質問があれば conversation を上書き ★★★
    if (nextStep < questions.length) {
      setConversation({ type: 'question', text: questions[nextStep] });
    } else {
      // 質問が全て終わったら完了メッセージで上書き
      setConversation({ type: 'completion', text: '質問完了！お疲れさまでした' });
    }
    setStep(nextStep);
  };

  useEffect(() => {
    const savedAnswers = localStorage.getItem('answers')
    const savedStep = localStorage.getItem('step')
    if (savedAnswers && savedStep) {
      const parsedAnswers: string[] = JSON.parse(savedAnswers)
      const parsedStep: number = Number(savedStep)
      setAnswers(parsedAnswers)
      setStep(parsedStep)

   // ★★★ 保存されたステップに基づいて会話を再構築（最新のメッセージのみ） ★★★
      if (parsedStep < questions.length) {
        setConversation({ type: 'question', text: questions[parsedStep] });
      } else {
        setConversation({ type: 'completion', text: '質問完了！お疲れさまでした' });
      }
      // アドバイスの状態はリセット
      setSuggestion(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('answers', JSON.stringify(answers))
    localStorage.setItem('step', step.toString())
  }, [answers, step])

  const getAdvice = async () => {
    setLoadingAdvice(true)
    setAssistantFace('/assistant-thinking.png')

    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
    // ★★★ アドバイスで conversation を上書き ★★★
      setConversation({ type: 'advice', text: data.suggestion });
      setSuggestion(data.suggestion); // suggestion ステートはまだ利用できます
    } catch (err) {
      console.error('アドバイス取得失敗:', err)
      alert('アドバイス取得に失敗しました')
      // エラー時も会話履歴にメッセージで上書き
      setConversation({ type: 'advice', text: 'アドバイス取得に失敗しました。' });
    } finally {
      setLoadingAdvice(false);
      setAssistantFace('/assistant-default.png');
    }
  };


  const handleFoundSave = async (location: string, memo: string) => {
    const data = {
      createdAt: Timestamp.now(),
      answers,
      foundLocation: location,
      foundMemo: memo,
    }

    try {
      await addDoc(collection(db, 'cases'), data)
      alert('事件簿に保存しました！')
      localStorage.removeItem('answers')
      localStorage.removeItem('step')
      setAnswers([])
      setStep(0)
      setInput('')
      setConversation({ type: 'question', text: questions[0] });
      setSuggestion(null)
    } catch (error) {
      console.error('保存失敗:', error)
      alert('保存に失敗しました...')
    }
  }

  const handleReset = () => {
    if (confirm('本当にリセットしますか？')) {
      localStorage.removeItem('answers')
      localStorage.removeItem('step')
      setAnswers([])
      setStep(0)
      setInput('')
        setConversation({ type: 'question', text: questions[0] });
      setSuggestion(null)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      const newAnswers = [...answers]
      newAnswers.pop();
      setAnswers(newAnswers);

      const prevStep = step - 1
      setStep(prevStep);
      setInput('');

      // ★★★ 戻る時も会話履歴を調整 (直前の質問またはアドバイスに設定) ★★★
      if (prevStep < questions.length) {
          setConversation({ type: 'question', text: questions[prevStep] });
      } else {
          // 質問が全て終わった後で戻る場合、完了メッセージを表示
          setConversation({ type: 'completion', text: '質問完了！お疲れさまでした' });
      }
      setSuggestion(null);
    }
  };



  return (
    <main
      className="min-h-screen p-4 flex flex-col items-center relative font-sans bg-cover bg-center"
      style={{ backgroundImage: "url('/background-main.jpg')" }}
    >
      <div className="absolute top-4 left-4 z-20">
        <Link href="/" className="text-blue-500 hover:underline">
          &lt; ホームに戻る
        </Link>
      </div>

      <div className="absolute top-4 right-4 bg-white shadow-lg rounded p-3 w-60 text-sm border">
        <h2 className="font-semibold mb-2">📝 捜査メモ</h2>
        <ul className="list-disc list-inside space-y-1">
          {answers.map((a, i) => (
            <li key={i}>
              <strong>{questions[i]}：</strong> {a}
            </li>
          ))}
        </ul>
      </div>

      <img
        src={assistantFace}
        alt="助手"
        className="fixed bottom-0 left-[40%] transform -translate-x-1/2 z-10 w-[400px] md:w-[520px] h-auto pointer-events-none select-none"
      />

      {/* ★★★ 助手の会話とアドバイスの表示領域 (単一の吹き出し) */}
  {conversation && ( 
        <div className="relative bg-white bg-opacity-90 rounded-xl shadow-lg p-4 max-w-md w-70 z-20 mt-60"> {/* max-w-mdに変更、p-4、rounded-xlを維持、z-20を維持 */}
          {/* 吹き出しのしっぽ */}
{/* top-full を bottom-full に、border-t-8 を border-b-8 に変更 */}
          <div className="absolute bottom-full left-8 transform -translate-x-1/2 mt-1 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-white"></div>

          {(conversation.type === 'question' || conversation.type === 'advice') && (
            <p> 助手：{conversation.text}</p>
          )}
          {conversation.type === 'completion' && (
              <p className="text-center text-gray-600 italic py-2">
                  {conversation.text}
              </p>
          )}
        </div>
      )}
      {/* ★★★ 統合表示終わり ★★★ */}


      {step < questions.length && (
        <div className="w-full max-w-md flex gap-2 mt-auto mb-4 z-20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border p-2 flex-1 rounded bg-white text-black"
            placeholder="答えてね"
          />

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 z-20"
          >
            送信
          </button>
        </div>
      )}

      {answers.length > 0 && (
        <div className="mt-4 flex flex-col items-center z-20">
          <button
            onClick={getAdvice}
            disabled={loadingAdvice}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 z-20"
          >
            🔍 アドバイスをもらう
          </button>

          {/* ★★★ 古いアドバイス表示を削除 ★★★ */}
          {/* {suggestion && (
            <p className="mt-2 text-sm text-gray-700 z-20">
              💡 <strong>助手のアドバイス：</strong> {suggestion}
            </p>
          )} */}
        </div>
      )}

      {answers.length > 0 && (
        <button
          onClick={() => setShowFoundModal(true)}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 z-20"
        >
          ✅ 見つかった！事件簿に記録する
        </button>
      )}

      <FoundModal
        open={showFoundModal}
        onClose={() => setShowFoundModal(false)}
        onSave={handleFoundSave}
      />

      {/* ★★★ CaseNotebook コンポーネントを配置し、fixedで右下に固定 ★★★ */}
      <div className="fixed right-4 top-[140px] z-20 md:bottom-4 md:top-auto"> {/* top-140をtop-[140px]に修正 */}
          <CaseNotebook />
      </div>


      <button
        onClick={handleReset}
        className="text-sm text-gray-500 underline hover:text-red-500 mt-2 z-20"
      >
        🔄 リセットする
      </button>

      <button
        onClick={handleBack}
        className="text-sm text-gray-500 underline hover:text-blue-500 mt-2 z-20"
      >
        ◀ ひとつ前に戻る
      </button>
    </main>
  )
}