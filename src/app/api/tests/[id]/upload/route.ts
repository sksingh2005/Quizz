import { NextResponse } from 'next/server';
import { parseDocument } from '@/lib/parser';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        console.log('Upload API called');
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.log('No file found in formData');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Only support DOCX for now due to PDF parsing compatibility issues
        if (!file.name.toLowerCase().endsWith('.docx')) {
            return NextResponse.json({
                error: 'Only DOCX files are supported. Please convert your PDF to DOCX or copy the content into a Word document.'
            }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileType = 'docx';
        console.log(`Processing as ${fileType}`);

        const result = await parseDocument(buffer, fileType);
        console.log('Parsing complete', result);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
    }
}
