import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { TestSession, Question, Test } from '@/lib/db/models';
import { getRedisPublisher } from '@/lib/redis';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ testId: string }> }) {
    await dbConnect();
    const authSession = await getServerSession(authOptions);

    if (!authSession || authSession.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { testId } = await params;
        const { action, index } = await req.json();

        // Verify ownership
        const test = await Test.findById(testId).lean();
        if (!test || (test as any).createdBy?.toString() !== authSession.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // action: 'START' | 'NEXT' | 'PREV' | 'GOTO' | 'PAUSE' | 'FINISH'

        const testSession = await TestSession.findOne({ testId });
        if (!testSession) {
            return NextResponse.json({ error: 'Session not found. Create one first.' }, { status: 404 });
        }

        // Get total question count for bounds checking
        const totalQuestions = await Question.countDocuments({ testId });

        switch (action) {
            case 'START':
                testSession.status = 'active';
                testSession.startedAt = new Date();
                testSession.currentQuestionIndex = 0;
                break;
            case 'NEXT':
                if (testSession.currentQuestionIndex < totalQuestions - 1) {
                    testSession.currentQuestionIndex += 1;
                }
                break;
            case 'PREV':
                testSession.currentQuestionIndex = Math.max(0, testSession.currentQuestionIndex - 1);
                break;
            case 'GOTO':
                if (typeof index === 'number' && index >= 0 && index < totalQuestions) {
                    testSession.currentQuestionIndex = index;
                }
                break;
            case 'PAUSE':
                testSession.status = 'paused';
                break;
            case 'RESUME':
                testSession.status = 'active';
                break;
            case 'FINISH':
                testSession.status = 'finished';
                // Auto-draft the test so it's no longer joinable by new students
                await Test.findByIdAndUpdate(testId, { status: 'draft' });
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        testSession.updatedAt = new Date();
        await testSession.save();

        // Publish event to Redis → Socket.io server picks it up and broadcasts
        const redisPub = getRedisPublisher();
        await redisPub.publish('test-control', JSON.stringify({
            testId,
            currentQuestionIndex: testSession.currentQuestionIndex,
            status: testSession.status,
        }));

        return NextResponse.json({
            success: true,
            session: {
                status: testSession.status,
                currentQuestionIndex: testSession.currentQuestionIndex,
            },
            totalQuestions,
        });
    } catch (error) {
        console.error('Control session error:', error);
        return NextResponse.json({ error: 'Failed to control session' }, { status: 500 });
    }
}
