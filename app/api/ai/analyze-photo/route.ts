import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { updatePhotoAnalysis } from '@/lib/db/jobs';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { photoId, imageBase64, mimeType = 'image/jpeg', jobContext = '' } = await req.json();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `You are a roofing and construction expert. Analyze this photo${jobContext ? ` for job: ${jobContext}` : ''}. Identify:
1. Visible damage or wear (be specific: shingles, flashing, gutters, siding, etc.)
2. Urgency level (Immediate/Soon/Routine)
3. Recommended repairs
4. Estimated scope (small patch / section replacement / full replacement)
Keep response under 150 words, professional tone.`,
          },
        ],
      }],
    });

    const analysis = response.content[0].type === 'text' ? response.content[0].text : '';

    if (photoId) {
      await updatePhotoAnalysis(Number(photoId), analysis);
    }

    return NextResponse.json({ analysis });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
