import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { Attempt, Question } from '@/lib/db/models';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Reuse the grading logic (should be extracted to a service)
async function gradeAttempt(attemptId: string) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.status === 'graded') return;

    const questions = await Question.find({ testId: attempt.testId });
    let totalScore = 0;

    const gradedAnswers = attempt.answers.map((ans: any) => {
        const question = questions.find(q => q._id.toString() === ans.questionId.toString());
        if (!question) return ans;

        let isCorrect = false;
        if (JSON.stringify(ans.givenAnswer) === JSON.stringify(question.correctAnswer)) {
            isCorrect = true;
        }
        if (typeof ans.givenAnswer === 'string' && typeof question.correctAnswer === 'string') {
            isCorrect = ans.givenAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
        }

        const awardedMarks = isCorrect ? question.marks : (question.negativeMarks ? -question.negativeMarks : 0);
        totalScore += awardedMarks;

        return {
            ...ans,
            isMarkedCorrect: isCorrect,
            awardedMarks,
        };
    });

    attempt.answers = gradedAnswers;
    attempt.score = totalScore;
    attempt.status = 'graded';
    attempt.submittedAt = new Date();
    attempt.gradedAt = new Date();
    attempt.resultVisibilityAt = new Date(); // Immediate for MVP

    await attempt.save();
    console.log(`Attempt ${attemptId} auto-graded.`);
}

export const worker = new Worker('grading-queue', async job => {
    if (job.name === 'test-expiry') {
        const { attemptId } = job.data;
        console.log(`Processing expiry for attempt ${attemptId}`);

        // Connect DB if needed (worker might run in separate process)
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI!);
        }

        await gradeAttempt(attemptId);
    }
}, { connection });

worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
});
