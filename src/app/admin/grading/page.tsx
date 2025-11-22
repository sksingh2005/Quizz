'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GradingDashboard() {
    const [attempts, setAttempts] = useState<any[]>([]);

    useEffect(() => {
        // TODO: Implement API to fetch attempts needing grading
        // fetch('/api/admin/grading').then(...)
    }, []);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Manual Grading Queue</h1>
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    No attempts pending manual review.
                </CardContent>
            </Card>
        </div>
    );
}
