import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { cases } = await req.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const formatted = cases.map((c, i) => {
      return `▼ Case ${i + 1}
- 失くした物: ${c.answers?.[0] ?? '不明'}
- 最後に見た場所: ${c.answers?.[2] ?? '不明'}
- 見つけた場所: ${c.foundLocation ?? '不明'}
- 見つけた理由: ${c.foundMemo ?? '不明'}`
    }).join('\n\n')

    const prompt = `
以下は、失くしものに関する事件簿の記録です。
この情報をもとに、ユーザーの失くしものの傾向を分析し、
「よく失くす物」「よく見つかる場所」「アドバイス」を簡潔に伝えてください。
口調は優しく、内容は50〜100字以内で。

${formatted}
    `

    const result = await model.generateContent(prompt)
    const text = await result.response.text()

    return NextResponse.json({ summary: text })
  } catch (err) {
    console.error('Gemini summary APIエラー:', err)
    return NextResponse.json({ summary: '傾向分析に失敗しました' }, { status: 500 })
  }
}
