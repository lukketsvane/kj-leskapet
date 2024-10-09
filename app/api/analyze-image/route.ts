import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json()

    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const items = content.split('\n').filter(line => line.trim() !== '')

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error analyzing image:', error)
    return NextResponse.json(
      { error: 'Error analyzing image: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}