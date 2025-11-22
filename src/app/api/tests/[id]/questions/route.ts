import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Question, Test } from '@/lib/db/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { questions } = await req.json();
        const { id } = await params;
        const testId = id;

        // Add testId to each question
        const questionsWithTestId = questions.map((q: any) => ({
            ...q,
            testId,
        }));

        // Bulk insert questions
        const createdQuestions = await Question.insertMany(questionsWithTestId);

        // Update Test with sections (derived from questions)
        // This logic assumes sections are defined in the questions
        const sectionsMap = new Map();
        questions.forEach((q: any) => {
            if (q.section && !sectionsMap.has(q.section)) {
                sectionsMap.set(q.section, {
                    id: crypto.randomUUID(),
                    name: q.section,
                    order: sectionsMap.size + 1,
                });
            }
        });

        await Test.findByIdAndUpdate(testId, {
            $set: { sections: Array.from(sectionsMap.values()) }
        });

        return NextResponse.json({ success: true, count: createdQuestions.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }
}
