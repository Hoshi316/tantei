

//tantei-rho.vercel.app
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
  '何を盗まれましたか？',
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
  const [suggestion, setSuggestion] = useState<string | null>(null) // アドバイス取得中用
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [showSuggestionBubble, setShowSuggestionBubble] = useState(false) // アドバイス吹き出しの表示を制御するステート
  const [showFoundModal, setShowFoundModal] = useState(false)

  const [conversation, setConversation] = useState<
    { type: 'question' | 'advice' | 'completion', text: string } | null
  >(null);

  //menu
   const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])



  // ★★★ 新しいステートを追加: 保留ボタンの表示状態 ★★★
  const [showPendingButton, setShowPendingButton] = useState(false);

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
      setShowPendingButton(true); // ★★★ ロード時にも質問完了なら表示 ★★★
    }
    setStep(nextStep)
    setShowSuggestionBubble(false) // アドバイス吹き出しを閉じる
    setSuggestion(null) // アドバイス内容もクリア
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
        setShowPendingButton(true); // ★★★ 質問完了時に保留ボタンを表示 ★★★
      }
       setSuggestion(null)
      setShowSuggestionBubble(false)
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('answers', JSON.stringify(answers))
    localStorage.setItem('step', step.toString())
  }, [answers, step])

  const getAdvice = async () => {
    setLoadingAdvice(true)
    setAssistantFace('/assistant-thinking.png')
    setShowSuggestionBubble(false) // アドバイス取得中は一旦吹き出しを隠す
   try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setSuggestion(data.suggestion) // suggestion ステートにアドバイスを設定
      setShowSuggestionBubble(true) // アドバイス取得後に吹き出しを表示
    } catch (err) {
      console.error('アドバイス取得失敗:', err)
      alert('アドバイス取得に失敗しました')
      setSuggestion('アドバイス取得に失敗しました。'); // 失敗時もsuggestionを設定
      setShowSuggestionBubble(true); // 失敗時も吹き出しを表示
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
    setSuggestion(null);
    setShowSuggestionBubble(false);
    setShowPendingButton(false); // ★★★ リセット時に保留ボタンを非表示 ★★★
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
      status: 'resolved',
      foundLocation: location,
      foundMemo: memo,
      userId: user.uid,
    };

    console.log('保存しようとしてるデータ:', data);

    try {
      console.log('[debug] before addDoc');
      const ref = collection(db, collectionName);
      console.log('[debug] collection ref:', ref);
      await addDoc(collection(db, collectionName), data)
      alert('事件簿に保存しました！')
      resetAllStates();
    } catch (error: unknown) {
      console.error('保存失敗:', error)
      alert('保存に失敗しました...')
    }
  }

   const handleSaveAsPending = async () => {
    if (confirm('この事件を「探索中（保留）」として事件簿に記録しますか？')) {
      if (!user) {
        alert('ログインしていません。');
        return;
      }

      console.log('現在のユーザー情報:', user); 

      const collectionName = process.env.NODE_ENV === 'development' ? 'cases-dev' : 'cases';

      const data = {
        createdAt: Timestamp.now(),
        answers,
        status: 'pending',
        foundLocation: '未発見',
        foundMemo: '探索中（保留）',
        userId: user.uid,
      };

      console.log('保存しようとしてるデータ:', data);
      console.log('使用中のコレクション名:', collectionName);


            try {
              console.log('[debug] before addDoc');
              await addDoc(collection(db, collectionName), data);
              console.log('[debug] after addDoc');
              alert('事件を探索中として事件簿に記録しました！');
              resetAllStates();
            } catch (error: unknown) {
              console.error('保留保存失敗:', error);
              alert('保留保存に失敗しました...');
            }

    }
  };


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
      setSuggestion(null);
      setShowSuggestionBubble(false);
      setShowMenu(false); // ★戻るボタン後にメニューを閉じる

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
      {/* ★★★ 助手の質問吹き出し ★★★ */}
      {conversation && ( // conversation が null でない場合のみ表示
        <div className="relative bg-white bg-opacity-90 rounded-xl shadow-lg p-4 max-w-md w-full z-20 mt-60">
          {/* 吹き出しのしっぽ */}
          <div className="absolute bottom-full left-8 transform -translate-x-1/2 mt-1 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-white"></div>

          {(conversation.type === 'question' || conversation.type === 'completion') && (
            <p className="text-sm text-gray-800">
              👓 助手：{conversation.text}
            </p>
          )}
          {/* 完了メッセージは completion タイプで表示 */}
          {/* conversation.type === 'completion' はもう上記の p タグで含まれているため、このブロックは不要です
          <p className="text-center text-gray-600 italic py-2">
              ✅ {conversation.text}
          </p>
          */}
        </div>
      )}
      {/* ★★★ 助手の質問吹き出し終わり ★★★ */}

      {/* ★★★ 助手のアドバイス吹き出し（別途追加） ★★★ */}
      {showSuggestionBubble && suggestion && (
        <div className="relative bg-yellow-100 bg-opacity-90 rounded-xl shadow-lg p-4 max-w-md w-full z-20 mt-4"> {/* mt-4で質問吹き出しの下に配置 */}
          {/* 吹き出しのしっぽ（アドバイス用の色） */}
          <div className="absolute bottom-full left-8 transform -translate-x-1/2 mt-1 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-yellow-100"></div> {/* しっぽを下向き（上向き）に */}
          
          <p className="text-sm text-gray-800">
            💡 <strong>助手のアドバイス：</strong> {suggestion}
          </p>
        </div>
      )}
      {/* ★★★ アドバイス吹き出し終わり ★★★ */}


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

      {/* 1. アドバイスをもらうボタン */}
      {answers.length > 0 && ( // 回答がある場合のみ表示
        <div className="mt-4 flex flex-col items-center z-20"> {/* 位置調整用のdiv */}
          <button
            onClick={getAdvice}
            disabled={loadingAdvice}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 z-20"
          >
            🔍 アドバイスをもらう
          </button>
        </div>
      )}

      {/* 2. 「見つかった！」ボタンの表示条件を変更 */}
      {/* answers.length > 0 && true (常にtrue) に変更。
          showPendingButton との排他条件を削除。
          これで answers があれば常に表示される。 */}
      {answers.length > 0 && (
        <div className="mt-4 flex flex-col items-center z-20">
          <button
            onClick={() => setShowFoundModal(true)}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 z-20"
          >
            ✅ 見つかった！事件簿に記録する
          </button>
        </div>
      )}


      {/* 3. 「探索中（保留）」ボタン */}
      {showPendingButton && ( // 質問完了後に表示される保留ボタン
        <div className="mt-4 flex flex-col items-center z-20"> {/* 位置調整用のdiv */}
          <button
            onClick={handleSaveAsPending} // 新しく作った関数を呼び出す
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 z-20"
          >
            🔄 探索中（保留）
          </button>
        </div>
      )}



      <FoundModal open={showFoundModal} onClose={() => setShowFoundModal(false)} onSave={handleFoundSave} />
      <div className="fixed right-4 top-[140px] z-20 md:bottom-4 md:top-auto">
        <CaseNotebook />
      </div>


      {/* ★★★ メニューボタンとメニューパネルをここに追加 ★★★ */}
      <div className="fixed tom-4 left-4 z-20"> {/* 位置を左下に固定 */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors duration-200"
          aria-label="操作メニューを開く"
        >
          ☰ メニュー
        </button>

        {showMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-30">
            {/* メニューアイテム：ホームに戻る */}
            <Link href="/" className="block px-4 py-2 text-gray-800 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
              🏠 ホームに戻る
            </Link>
            {/* メニューアイテム：ひとつ前に戻る */}
            <button
              onClick={handleBack}
              className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
            >
              ◀ ひとつ前に戻る
            </button>
            {/* メニューアイテム：リセットする */}
            <button
              onClick={handleReset}
              className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
            >
              🔄 リセットする
            </button>
            {/* メニューアイテム：ログアウト */}
            {user && ( // ユーザーがログインしている場合のみ表示
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
              >
                🚪 ログアウト
              </button>
            )}
          </div>
        )}
      </div>



    </main>
  )
}
