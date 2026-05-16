import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Attempt, Test } from '@/lib/db/models';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gradingQueue } from "@/lib/queue/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const testId = id;
        const userId = session.user.id;

        const test = await Test.findById(testId);
        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Check for existing active attempt
        const existingAttempt = await Attempt.findOne({
            testId,
            userId,
            status: 'in_progress'
        });

        if (existingAttempt) {
            return NextResponse.json(existingAttempt);
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + test.durationSeconds * 1000);

        const attempt = await Attempt.create({
            testId,
            userId,
            startAt: now,
            expiresAt,
            status: 'in_progress',
            answers: []
        });

        // Schedule BullMQ job for expiry
        const delay = test.durationSeconds * 1000;
        await gradingQueue.add('test-expiry', { attemptId: attempt._id }, { delay });

        return NextResponse.json(attempt);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to start attempt' }, { status: 500 });
    }
}
