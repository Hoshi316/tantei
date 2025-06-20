import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(req: NextRequest) {
  const { answer } = await req.json()

  const prompt = `
あなたは失くしもの探偵アプリの助手です。
以下のユーザーの回答を読み、重要度を踏まえた自然な日本語のリアクションを1文だけ生成してください。

例：
回答：AirPods
出力：AirPodsはよく見失いがちですよね。

回答：家の鍵
出力：それは困りますね。鍵がないと家に入れないですし、急いで探しましょう。


回答：${answer}

出力：
`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = await result.response.text()
    return NextResponse.json({ reaction: text.trim() })
  } catch (err) {
    console.error('リアクション生成失敗:', err)
    return NextResponse.json({ reaction: 'なるほど...' }, { status: 500 })
  }
}
