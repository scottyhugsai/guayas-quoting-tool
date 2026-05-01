import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { type, context } = await req.json();

    const prompts: Record<string, string> = {
      follow_up: `Write a professional follow-up email for a roofing/construction quote. Context: ${JSON.stringify(context)}. Keep it friendly, under 150 words. Include subject line.`,
      invoice_reminder: `Write a polite invoice payment reminder email. Context: ${JSON.stringify(context)}. Professional, friendly tone. Under 120 words. Include subject line.`,
      job_complete: `Write a job completion notification email to a client. Context: ${JSON.stringify(context)}. Warm, professional. Mention satisfaction guarantee. Under 150 words. Include subject line.`,
      welcome: `Write a welcome email to a new client. Context: ${JSON.stringify(context)}. Introduce Guayas Roofing & Construction (Charleston SC), set expectations. Under 150 words. Include subject line.`,
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: prompts[type] || `Write a professional construction company email. Context: ${JSON.stringify(context)}. Under 150 words. Include subject line.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const [subjectLine, ...bodyLines] = text.split('\n').filter(Boolean);
    const subject = subjectLine.replace(/^subject:\s*/i, '');
    const body = bodyLines.join('\n').trim();

    return NextResponse.json({ subject, body, full: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
