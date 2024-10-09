import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json()

    if (!image || !prompt) {
      return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
    })

    const result = response.choices[0].message.content
    let items

    try {
      items = JSON.parse(result)
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      return NextResponse.json({ error: 'Invalid response from OpenAI' }, { status: 500 })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error in /api/analyze-image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}