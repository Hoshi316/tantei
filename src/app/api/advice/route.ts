import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json()

    const prompt = `
あなたはとても親切で頭の良い助手です。
ユーザーは物を失くしてしまいました。
以下の情報を元に、どこを探せば良いか、推理してアドバイスをしてください。
${answers.map((q: string, i: number) => `Q${i + 1}: ${q}`).join('\n')}
アドバイスは50文字以内でシンプルに。`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt)
    const text = await result.response.text()

    return NextResponse.json({ suggestion: text })
  } catch (err) {
    console.error('Gemini APIエラー:', err)
    return NextResponse.json({ suggestion: 'アドバイス取得に失敗しました' }, { status: 500 })
  }
}