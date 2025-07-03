
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ error: 'This admin API endpoint has been disabled to resolve configuration issues.' }, { status: 404 });
}
