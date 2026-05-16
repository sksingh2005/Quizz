import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Attempt } from '@/lib/db/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { questionId, givenAnswer } = await req.json();
        const { id } = await params;
        const attemptId = id;

        // Fetch attempt to validate
        const attempt = await Attempt.findById(attemptId);

        if (!attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        // Prevent saving if test is expired
        if (new Date() > new Date(attempt.expiresAt)) {
            return NextResponse.json({ error: 'Test has expired' }, { status: 400 });
        }

        // Prevent saving if test is already submitted
        if (attempt.status !== 'in_progress') {
            return NextResponse.json({ error: 'Test has been submitted' }, { status: 400 });
        }

        await Attempt.updateOne(
            { _id: attemptId, 'answers.questionId': questionId },
            {
                $set: {
                    'answers.$.givenAnswer': givenAnswer,
                    'answers.$.savedAt': new Date()
                }
            }
        );

        // If answer doesn't exist yet, push it
        const answerExists = attempt.answers.some((a: any) => a.questionId.toString() === questionId);

        if (!answerExists) {
            await Attempt.findByIdAndUpdate(attemptId, {
                $push: {
                    answers: {
                        questionId,
                        givenAnswer,
                        savedAt: new Date(),
                        autoScored: true
                    }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }
}
