import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { question, correctAnswer, explanation, userAnswer } = await req.json();

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ explanation: "AI explanation is not configured." });
        }

        if (!question) {
            return NextResponse.json({ error: 'Question data is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are a helpful tutor specializing in Physics, Chemistry, and Biology for NEET exam preparation. 

Question: ${question}
Correct Answer: ${correctAnswer}
${explanation ? `Existing Explanation: ${explanation}` : ''}
${userAnswer ? `User's Answer: ${userAnswer}` : ''}

Provide a clear, detailed explanation of why the correct answer is right. If the user got it wrong, explain their mistake. Focus on the underlying concepts and reasoning. Be encouraging and educational.And be concise to the questions not a random response please to the point not whole paragraph
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ explanation: text });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
    }
}
