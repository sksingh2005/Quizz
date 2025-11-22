'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowRight, Loader2 } from 'lucide-react';

interface Test {
    _id: string;
    title: string;
    durationSeconds: number;
    status: string;
    attempt: {
        _id: string;
        status: 'in_progress' | 'submitted' | 'graded';
        score?: number;
    } | null;
}

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            if (session?.user?.role === 'admin') {
                router.push('/admin');
                return;
            }

            fetch('/api/tests/user-attempts')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setTests(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status, session, router]);

    if (status === 'loading' || loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (status === 'unauthenticated') {
        return (
            <div className="container mx-auto p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
                <Link href="/login">
                    <Button>Go to Login</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Tests</h1>
                <div className="text-sm text-muted-foreground">
                    Welcome, {session?.user?.name}
                </div>
            </div>

            {tests.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        No tests available for your batch.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tests.map(test => (
                        <Card key={test._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{test.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                    <Clock className="h-4 w-4" />
                                    <span>{Math.floor(test.durationSeconds / 60)} mins</span>
                                </div>
                                {!test.attempt ? (
                                    <Link href={`/test/${test._id}/start`}>
                                        <Button className="w-full">
                                            Start Test <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : test.attempt.status === 'in_progress' ? (
                                    <Link href={`/test/${test.attempt._id}`}>
                                        <Button className="w-full" variant="secondary">
                                            Continue Test <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href={`/test/${test.attempt._id}/result`}>
                                        <Button className="w-full" variant="outline">
                                            View Results {test.attempt.score !== undefined && `(${test.attempt.score})`}
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
