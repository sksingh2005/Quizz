'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertTriangle, Download } from 'lucide-react';

interface ParsedQuestion {
    section: string;
    type: string;
    stem: string;
    options: { id: string; text: string }[];
    correctAnswer: any;
    marks: number;
    negativeMarks?: number;
    explanation?: string;
}

export default function UploadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/tests/${id}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.questions) {
                setQuestions(data.questions);
                setErrors(data.errors || []);
            } else {
                setErrors(['Failed to parse file']);
            }
        } catch (err) {
            setErrors(['Upload failed']);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/tests/${id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions }),
            });

            if (res.ok) {
                router.push('/admin'); // Redirect to dashboard
            } else {
                setErrors(['Failed to save questions']);
            }
        } catch (err) {
            setErrors(['Save failed']);
        } finally {
            setSaving(false);
        }
    };

    const updateQuestion = (index: number, field: keyof ParsedQuestion, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Upload Questions</h1>

            {/* Upload Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".docx"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                        <Button onClick={handleUpload} disabled={!file || loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                            Upload & Parse
                        </Button>
                        <a href="/api/template/download" download="quiz_template.txt">
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                        </a>
                    </div>
                    {errors.length > 0 && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Parsing Issues</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4">
                                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Preview Section */}
            {questions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Parsed Questions ({questions.length})</h2>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                            Confirm & Save
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {questions.map((q, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <CardTitle className="text-lg">Q{i + 1} ({q.type})</CardTitle>
                                        <span className="text-sm text-muted-foreground">{q.section}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Stem</Label>
                                        <Textarea
                                            value={q.stem}
                                            onChange={e => updateQuestion(i, 'stem', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>Correct Answer</Label>
                                            <Input
                                                value={q.correctAnswer}
                                                onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Marks</Label>
                                            <Input
                                                type="number"
                                                value={q.marks}
                                                onChange={e => updateQuestion(i, 'marks', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label>Negative Marks</Label>
                                            <Input
                                                type="number"
                                                step="0.25"
                                                value={q.negativeMarks || 0}
                                                onChange={e => updateQuestion(i, 'negativeMarks', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Explanation</Label>
                                        <Textarea
                                            value={q.explanation || ''}
                                            onChange={e => updateQuestion(i, 'explanation', e.target.value)}
                                        />
                                    </div>

                                    {/* Options Preview (Read-only for MVP or simple edit) */}
                                    {q.options && (
                                        <div className="space-y-2">
                                            <Label>Options</Label>
                                            {q.options.map((opt, j) => (
                                                <div key={j} className="flex gap-2 items-center">
                                                    <span className="font-bold w-6">{opt.id.toUpperCase()})</span>
                                                    <Input
                                                        value={opt.text}
                                                        onChange={e => {
                                                            const newOpts = [...q.options];
                                                            newOpts[j].text = e.target.value;
                                                            updateQuestion(i, 'options', newOpts);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
