import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Test, Attempt } from '@/lib/db/models';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Build query based on user role
        let testQuery = {};
        if (session.user.role !== 'admin') {
            testQuery = {
                batches: { $in: session.user.batches },
                status: 'published'
            };
        }

        // Fetch tests
        const tests = await Test.find(testQuery).sort({ createdAt: -1 }).lean();

        // Fetch user's attempts for these tests
        const testIds = tests.map(t => t._id);
        const attempts = await Attempt.find({
            testId: { $in: testIds },
            userId: session.user.id
        }).lean();

        // Create a map of testId -> attempt
        const attemptMap = new Map();
        attempts.forEach(attempt => {
            attemptMap.set(attempt.testId.toString(), attempt);
        });

        // Combine tests with their attempt status
        const testsWithAttempts = tests.map(test => {
            const attempt = attemptMap.get(test._id.toString());
            return {
                _id: test._id,
                title: test.title,
                description: test.description,
                durationSeconds: test.durationSeconds,
                status: test.status,
                attempt: attempt ? {
                    _id: attempt._id,
                    status: attempt.status,
                    score: attempt.score,
                    submittedAt: attempt.submittedAt
                } : null
            };
        });

        return NextResponse.json(testsWithAttempts);
    } catch (error) {
        console.error('Failed to fetch tests with attempts:', error);
        return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
    }
}
