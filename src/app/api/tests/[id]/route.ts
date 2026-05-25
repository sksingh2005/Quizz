import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Test } from '@/lib/db/models';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const test = await Test.findById(id).lean();
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Admins can only access their own tests
    if (session.user.role === 'admin' && (test as any).createdBy?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ownership before allowing update
    const existing = await Test.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    if ((existing as any).createdBy?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updatedTest = await Test.findByIdAndUpdate(id, body, { new: true }).lean();

    return NextResponse.json(updatedTest);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ownership before allowing delete
    const existing = await Test.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    if ((existing as any).createdBy?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Test.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}

