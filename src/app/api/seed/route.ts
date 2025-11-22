import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Batch } from '@/lib/db/models';

export async function GET() {
    await dbConnect();
    try {
        const count = await Batch.countDocuments();
        if (count === 0) {
            await Batch.insertMany([
                { name: 'Batch A', description: 'Morning Batch' },
                { name: 'Batch B', description: 'Evening Batch' },
                { name: 'Batch C', description: 'Weekend Batch' },
            ]);
            return NextResponse.json({ message: 'Seeded default batches' });
        }
        return NextResponse.json({ message: 'Batches already exist' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to seed batches' }, { status: 500 });
    }
}
