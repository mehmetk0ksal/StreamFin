import { NextResponse } from 'next/server';
import { getTrendingAudiusTracks, searchAudiusTracks } from '@/lib/audius';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get('q') || '').trim();

        const tracks = q ? await searchAudiusTracks(q) : await getTrendingAudiusTracks();
        return NextResponse.json({ tracks });
    } catch (err) {
        console.error('Music search error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch tracks from Audius.' },
            { status: 502 }
        );
    }
}