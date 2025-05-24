import { NextResponse } from 'next/server';

// API route for token generation
export async function GET() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key is not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(
            'https://api.openai.com/v1/realtime/sessions',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-realtime-preview-2024-12-17',
                    voice: 'verse',
                    tools: [
                        {
                            type: "function",
                            name: "evaluate_interview",
                            description: "Evaluate the technical interview candidate",
                            parameters: {
                                type: "object",
                                properties: {
                                    interview_summary: {
                                        type: "string",
                                        description: "Summary of the interview in 100-120 words"
                                    },
                                    score: {
                                        type: "object",
                                        properties: {
                                            communication: { type: "number", minimum: 0, maximum: 10 },
                                            problem_solving: { type: "number", minimum: 0, maximum: 10 },
                                            technical_depth: { type: "number", minimum: 0, maximum: 10 },
                                            culture_fit: { type: "number", minimum: 0, maximum: 10 },
                                            clarity_brevity: { type: "number", minimum: 0, maximum: 10 }
                                        }
                                    }
                                },
                                required: ["interview_summary", "score"]
                            }
                        }
                    ],
                    tool_choice: "auto"
                }),
            }
        );

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Token generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
