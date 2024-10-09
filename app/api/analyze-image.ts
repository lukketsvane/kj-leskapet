import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and list all the food items you can see. Focus on identifying individual ingredients and food products. Provide the list in Norwegian." },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const items = response.choices[0].message.content
      ?.split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    return res.status(200).json({ items })
  } catch (error) {
    console.error('Error analyzing image:', error)
    return res.status(500).json({ error: 'Error analyzing image' })
  }
}