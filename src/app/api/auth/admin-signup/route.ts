import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import bcrypt from 'bcryptjs';

function getAdminEmails(): string[] {
    const raw = process.env.ADMIN_EMAILS || '';
    return raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!email.endsWith('@nitj.ac.in')) {
            return NextResponse.json({ error: 'Only @nitj.ac.in email addresses are allowed' }, { status: 400 });
        }

        // Check if the email is in the admin whitelist
        const adminEmails = getAdminEmails();
        if (adminEmails.length === 0) {
            return NextResponse.json(
                { error: 'Admin registration is not configured. Please contact the system administrator.' },
                { status: 403 }
            );
        }

        if (!adminEmails.includes(email.toLowerCase())) {
            return NextResponse.json(
                { error: 'This email is not authorized for admin registration. Please contact the system administrator.' },
                { status: 403 }
            );
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: 'admin',
        });

        return NextResponse.json({ success: true, userId: user._id }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 });
    }
}
