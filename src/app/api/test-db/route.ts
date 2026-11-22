import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Manuel SQL sorgusu ile PostgreSQL sunucu saatini çekiyoruz
        const result = await query('SELECT NOW() AS current_time');
        return NextResponse.json({
            status: 'success',
            message: 'PostgreSQL bağlantısı başarılı!',
            serverTime: result.rows[0].current_time,
        });
    } catch {
        return NextResponse.json(
            {
                status: 'error',
                message: 'Veritabanına bağlanılamadı',
            },
            { status: 500 }
        );
    }
}
