'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Info, Shield, AlertTriangle, Eye, Maximize, CheckCircle2 } from 'lucide-react';

export default function StartTestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [acknowledged, setAcknowledged] = useState(false);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetch(`/api/tests/${id}`)
            .then(res => res.json())
            .then(setTest)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleStart = async () => {
        if (!acknowledged) return;

        setStarting(true);
        try {
            const res = await fetch(`/api/tests/${id}/start`, { method: 'POST' });
            if (res.ok) {
                const attempt = await res.json();
                router.push(`/test/${attempt._id}`); // Redirect to attempt page
            }
        } catch (error) {
            console.error('Failed to start test:', error);
            setStarting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (!test) return <div className="flex justify-center items-center h-screen">Test not found</div>;

    const rules = [
        {
            icon: Maximize,
            title: 'Fullscreen Mode Required',
            description: 'The test will automatically enter fullscreen mode. You must remain in fullscreen throughout the test.',
        },
        {
            icon: Eye,
            title: 'Tab Switching Prohibited',
            description: 'Switching to other browser tabs or windows is not allowed and will be detected as a violation.',
        },
        {
            icon: AlertTriangle,
            title: 'Minimizing Prohibited',
            description: 'Minimizing the browser window or using Alt+Tab is not allowed during the test.',
        },
        {
            icon: Shield,
            title: '3-Strike Policy',
            description: 'You are allowed a maximum of 3 violations. After the 3rd violation, your test will be automatically submitted.',
        },
    ];

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <Card className="border-2">
                <CardHeader className="border-b bg-muted/50">
                    <CardTitle className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-primary" />
                        {test.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Test Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-semibold">{Math.floor(test.durationSeconds / 60)} minutes</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Sections</p>
                            <p className="font-semibold">{test.sections?.length || 0} sections</p>
                        </div>
                    </div>

                    {test.description && (
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-muted-foreground">{test.description}</p>
                        </div>
                    )}

                    {/* Anti-Cheating Rules */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Important Test Rules
                        </h3>

                        <div className="grid gap-3">
                            {rules.map((rule, index) => (
                                <div
                                    key={index}
                                    className="flex gap-4 p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                                >
                                    <div className="shrink-0">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <rule.icon className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{rule.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {rule.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Warning Alert */}
                    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            Once you start, the timer will begin and cannot be paused.
                            Any attempt to switch tabs, minimize, or exit fullscreen will count as a violation.
                            After 3 violations, your test will be automatically submitted.
                        </AlertDescription>
                    </Alert>

                    {/* Acknowledgment Checkbox */}
                    <div
                        className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${acknowledged
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                        onClick={() => setAcknowledged(!acknowledged)}
                    >
                        <Checkbox
                            id="acknowledge"
                            checked={acknowledged}
                            onCheckedChange={(checked) => setAcknowledged(checked === true)}
                            className="mt-0.5"
                        />
                        <div className="space-y-1">
                            <Label
                                htmlFor="acknowledge"
                                className="font-medium cursor-pointer"
                            >
                                I understand and agree to the test rules
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                By checking this box, I confirm that I have read and understood the anti-cheating
                                policies. I agree to take the test in fullscreen mode without switching tabs or
                                minimizing the window.
                            </p>
                        </div>
                    </div>

                    {/* Start Button */}
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg font-semibold"
                        onClick={handleStart}
                        disabled={!acknowledged || starting}
                    >
                        {starting ? (
                            <>Starting Test...</>
                        ) : acknowledged ? (
                            <>
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Start Test Now
                            </>
                        ) : (
                            'Please acknowledge the rules to continue'
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
