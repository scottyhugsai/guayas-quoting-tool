import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { serviceType, currentScope, jobValue } = await req.json();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are a sales advisor for Guayas Roofing & Construction in Charleston SC.
Job: ${serviceType}, scope: ${currentScope}, value: $${jobValue}.
Suggest 3 specific upsells or add-ons that would genuinely benefit this client and increase job value.
Format as JSON array: [{"title": "...", "description": "...", "estimated_value": 1234}]
Only output the JSON array, nothing else.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const suggestions = JSON.parse(text.trim());
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
