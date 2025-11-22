import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Attempt, Question } from '@/lib/db/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const attemptId = id;
        const attempt = await Attempt.findById(attemptId);

        if (!attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        // Simple synchronous grading for MVP
        // In production, this should be a BullMQ job
        const questions = await Question.find({ testId: attempt.testId });
        let totalScore = 0;

        const gradedAnswers = attempt.answers.map((ans: any) => {
            const question = questions.find(q => q._id.toString() === ans.questionId.toString());
            if (!question) return ans;

            // Check if question was actually answered
            const wasAnswered = ans.givenAnswer !== null && ans.givenAnswer !== undefined && ans.givenAnswer !== '';

            let isCorrect = false;
            let awardedMarks = 0;

            if (wasAnswered) {
                // Simple equality check (enhance for arrays/sets)
                if (JSON.stringify(ans.givenAnswer) === JSON.stringify(question.correctAnswer)) {
                    isCorrect = true;
                }
                // Handle case-insensitive string
                if (typeof ans.givenAnswer === 'string' && typeof question.correctAnswer === 'string') {
                    isCorrect = ans.givenAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
                }

                // Award marks: positive for correct, negative for wrong
                awardedMarks = isCorrect ? question.marks : -(question.negativeMarks || 0);
            }
            // If not answered, awardedMarks stays 0

            totalScore += awardedMarks;

            return {
                ...ans,
                isMarkedCorrect: isCorrect,
                awardedMarks,
            };
        });

        attempt.answers = gradedAnswers;
        attempt.score = totalScore;
        attempt.status = 'graded'; // Or 'grading' if manual review needed
        attempt.submittedAt = new Date();
        attempt.gradedAt = new Date();
        attempt.resultVisibilityAt = new Date(); // Immediate for MVP

        await attempt.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
    }
}
