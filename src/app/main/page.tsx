// src/app/main/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import FoundModal from '../components/FoundModal'
import CaseNotebook from '@/components/CaseNotebook'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

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
  const { user, loading } = useAuth()
  const router = useRouter()
  const [assistantFace, setAssistantFace] = useState('/assistant-default.png')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [showFoundModal, setShowFoundModal] = useState(false)

  const [conversation, setConversation] = useState<
    { type: 'question' | 'advice' | 'completion', text: string } | null
  >(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

   //  メイン画面ロード時にBGMを再生する
  useEffect(() => {
    const savedBgmSetting = localStorage.getItem('selectedBgm');
    const bgmA = document.getElementById('bgm-A') as HTMLAudioElement;
    const bgmB = document.getElementById('bgm-B') as HTMLAudioElement;

    // まず全てのBGMを停止
    const stopAllBgm = () => {
      if (bgmA) bgmA.pause();
      if (bgmB) bgmB.pause();
    };
    stopAllBgm();

    // 設定に基づいて再生
    if (savedBgmSetting === 'bgm-A' && bgmA) {
      bgmA.play().catch(e => console.error("BGM A再生失敗 (main page):", e));
    } else if (savedBgmSetting === 'bgm-B' && bgmB) {
      bgmB.play().catch(e => console.error("BGM B再生失敗 (main page):", e));
    }

    // クリーンアップ関数: このページを離れるときにBGMを停止
    return () => {
      stopAllBgm();
    };
  }, []); 

  useEffect(() => {
    if (conversation === null && step === 0) {
      setConversation({ type: 'question', text: questions[0] });
    }
  }, [step,conversation])

  const handleSubmit = async () => {
    if (!input.trim()) return
    const newAnswers = [...answers, input]
    setAnswers(newAnswers)
    try {
      await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: input })
      })
    } catch (_err: unknown) {
      console.error('handleSubmit APIコールエラー:', _err);
    }
    setInput('');
    const nextStep = step + 1;
    if (nextStep < questions.length) {
      setConversation({ type: 'question', text: questions[nextStep] });
    } else {
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
      if (parsedStep < questions.length) {
        setConversation({ type: 'question', text: questions[parsedStep] });
      } else {
        setConversation({ type: 'completion', text: '質問完了！お疲れさまでした' });
      }
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
      setConversation({ type: 'advice', text: data.suggestion });
    } catch (_err: unknown) {
      console.error('アドバイス取得失敗:', _err)
      alert('アドバイス取得に失敗しました')
      setConversation({ type: 'advice', text: 'アドバイス取得に失敗しました。' });
    } finally {
      setLoadingAdvice(false);
      setAssistantFace('/assistant-default.png');
    }
  };

  const resetAllStates = () => {
    localStorage.removeItem('answers');
    localStorage.removeItem('step');
    setAnswers([]);
    setStep(0);
    setInput('');
    setConversation({ type: 'question', text: questions[0] });
  };

  const handleFoundSave = async (location: string, memo: string) => {
    if (!user) {
      alert('ログインしていません。');
      return;
    }

    const collectionName = process.env.NODE_ENV === 'development' ? 'cases-dev' : 'cases';

    
    const data = {
      createdAt: Timestamp.now(),
      answers,
      foundLocation: location,
      foundMemo: memo,
      userId: user.uid,
    };

    console.log('保存しようとしてるデータ:', data);

    try {
      await addDoc(collection(db, collectionName), data)
      alert('事件簿に保存しました！')
      resetAllStates();
    } catch (error: unknown) {
      console.error('保存失敗:', error)
      alert('保存に失敗しました...')
    }
  }

  const handleReset = () => {
    if (confirm('本当にリセットしますか？')) {
      resetAllStates();
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
      if (prevStep < questions.length) {
        setConversation({ type: 'question', text: questions[prevStep] });
      } else {
        setConversation({ type: 'completion', text: '質問完了！お疲れさまでした' });
      }
    }
  };

  const handleSignOut = async () => {
    if (confirm('本当にログアウトしますか？')) {
      try {
        await signOut(auth);
        resetAllStates();
        router.push('/login');
      } catch (error) {
        console.error('ログアウトエラー:', error);
        alert('ログアウトに失敗しました。');
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>読み込み中、またはログインページへリダイレクト中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 flex flex-col items-center relative font-sans bg-cover bg-center" style={{ backgroundImage: "url('/background-main.jpg')" }}>
      <div className="absolute top-4 left-4 z-20">
        <Link href="/" className="text-blue-500 hover:underline">&lt; ホームに戻る</Link>
      </div>
      <div className="absolute top-4 right-4 bg-white shadow-lg rounded p-3 w-60 text-sm border">
        <h2 className="font-semibold mb-2">📝 捜査メモ</h2>
        <ul className="list-disc list-inside space-y-1">
          {answers.map((a, i) => (
            <li key={i}><strong>{questions[i]}：</strong> {a}</li>
          ))}
        </ul>
      </div>
      <Image src={assistantFace} alt="助手" className="fixed bottom-0 left-[40%] transform -translate-x-1/2 z-10 w-[400px] md:w-[520px] h-auto pointer-events-none select-none" width={520} height={520} priority sizes="(max-width: 768px) 400px, 520px" />
      {conversation && (
        <div className="relative bg-white bg-opacity-90 rounded-xl shadow-lg p-4 max-w-md w-70 z-20 mt-60">
          <div className="absolute bottom-full left-8 transform -translate-x-1/2 mt-1 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-white"></div>
          {(conversation.type === 'question' || conversation.type === 'advice') && (<p> 助手：{conversation.text}</p>)}
          {conversation.type === 'completion' && (<p className="text-center text-gray-600 italic py-2">{conversation.text}</p>)}
        </div>
      )}
      {step < questions.length && (
        <div className="w-full max-w-md flex gap-2 mt-auto mb-4 z-20">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="border p-2 flex-1 rounded bg-white text-black" placeholder="答えてね" />
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 z-20">送信</button>
        </div>
      )}
      {answers.length > 0 && (
        <div className="mt-4 flex flex-col items-center z-20">
          <button onClick={getAdvice} disabled={loadingAdvice} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 z-20">🔍 アドバイスをもらう</button>
        </div>
      )}
      {answers.length > 0 && (
        <button onClick={() => setShowFoundModal(true)} className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 z-20">✅ 見つかった！事件簿に記録する</button>
      )}
      <FoundModal open={showFoundModal} onClose={() => setShowFoundModal(false)} onSave={handleFoundSave} />
      <div className="fixed right-4 top-[140px] z-20 md:bottom-4 md:top-auto">
        <CaseNotebook />
      </div>
      <button onClick={handleReset} className="text-sm text-gray-500 underline hover:text-red-500 mt-2 z-20">🔄 リセットする</button>
      <button onClick={handleBack} className="text-sm text-gray-500 underline hover:text-blue-500 mt-2 z-20">◀ ひとつ前に戻る</button>
      {user && (
        <button onClick={handleSignOut} className="text-sm text-gray-500 underline hover:text-orange-500 mt-2 z-20">🚪 ログアウト</button>
      )}



    </main>
  )
}
