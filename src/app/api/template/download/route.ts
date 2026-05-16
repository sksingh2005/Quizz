import { NextResponse } from 'next/server';

export async function GET() {
    const templateContent = `=== SECTION: General Knowledge ===

Q1. (MCQ) What is the capital of France? [marks=1]
A) London
B) Berlin
C) Paris
D) Madrid
Answer: C
Explanation: Paris is the capital and most populous city of France.

Q2. (Multi-MCQ) Which of the following are prime numbers? [marks=2]
A) 2
B) 4
C) 5
D) 9
Answer: A, C
Explanation: 2 and 5 are prime numbers. 4 and 9 are composite.

Q3. (Integer) What is 12 divided by 4? [marks=1]
Answer: 3

=== SECTION: Science ===

Q4. (MCQ) The chemical symbol for Gold is Au. [marks=1]
A) True
B) False
Answer: A
Explanation: Au comes from the Latin word for gold, Aurum.
`;

    return new NextResponse(templateContent, {
        headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename="quiz_template.txt"',
        },
    });
}
