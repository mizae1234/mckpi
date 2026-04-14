import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const maxDuration = 30; // Max allowed function duration for Vercel

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseIds } = await request.json()
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'No courses provided' }, { status: 400 })
    }

    const API_KEY = process.env.GEMINI_API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing from server configuration' }, { status: 500 })
    }

    // 1. Fetch Course details
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { title: true, description: true }
    })

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Courses not found' }, { status: 404 })
    }

    // 2. Fetch distinct departments and positions
    const employees = await prisma.employee.findMany({
      select: { departmentCode: true, positionCode: true }
    })

    const uniqueDepartments = Array.from(new Set(employees.map(e => e.departmentCode).filter(Boolean)))
    const uniquePositions = Array.from(new Set(employees.map(e => e.positionCode).filter(Boolean)))

    // 3. Construct Context and Prompt
    const coursesInfo = courses.map(c => `- Title: ${c.title}\n  Description: ${c.description || 'N/A'}`).join('\n\n')

    const prompt = `You are an expert HR Training & Development Specialist. 
Analyze the following training courses:
${coursesInfo}

Available Departments in the company:
${uniqueDepartments.join(', ')}

Available Job Positions in the company:
${uniquePositions.join(', ')}

Based on the course titles and descriptions, determine which Departments are the most relevant and highly suggested to attend this training.

Return your recommendation strictly as a JSON object with this exact structure (Do not use Markdown wrapping around the JSON, just raw JSON text):
{
  "suggestedDepartments": ["department1", "department2"],
  "reasoning": "A brief explanation in THAI explaining why you selected these departments."
}`

    // 4. Send request to Gemini API (REST)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2, // Low temperature for consistent JSON
          responseMimeType: "application/json" // Force JSON output if supported
        }
      })
    })

    if (!response.ok) {
        const errData = await response.text()
        console.error('Gemini API Error:', errData)
        return NextResponse.json({ error: `Gemini API Error: ${errData}` }, { status: 500 })
    }

    const data = await response.json()
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textOutput) {
        return NextResponse.json({ error: 'Invalid response from Gemini' }, { status: 500 })
    }

    let parsedResponse;
    try {
        // Strip out possible markdown wrappers
        let cleanJson = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim()
        parsedResponse = JSON.parse(cleanJson)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json({ 
        suggestedDepartments: parsedResponse.suggestedDepartments || [],
        reasoning: parsedResponse.reasoning || ""
    })

  } catch (error: any) {
    console.error('[API] Gemini Recommend Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
