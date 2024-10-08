import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What food items do you see in this image? Please provide a list of items." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    const items = response.choices[0].message.content?.split('\n').map(item => item.trim().replace(/^-\s*/, '')) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}