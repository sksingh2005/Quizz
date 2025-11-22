'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function StartTestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/tests/${id}`)
            .then(res => res.json())
            .then(setTest)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleStart = async () => {
        const res = await fetch(`/api/tests/${id}/start`, { method: 'POST' });
        if (res.ok) {
            const attempt = await res.json();
            router.push(`/test/${attempt._id}`); // Redirect to attempt page
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!test) return <div>Test not found</div>;

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>{test.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose dark:prose-invert">
                        <p>{test.description}</p>
                        <ul>
                            <li>Duration: {Math.floor(test.durationSeconds / 60)} minutes</li>
                            <li>Total Sections: {test.sections.length}</li>
                        </ul>
                    </div>

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Instructions</AlertTitle>
                        <AlertDescription>
                            Once you start, the timer will begin and cannot be paused.
                            Ensure you have a stable internet connection.
                        </AlertDescription>
                    </Alert>

                    <Button size="lg" className="w-full" onClick={handleStart}>
                        Start Test Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
