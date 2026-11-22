import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Manuel SQL sorgusu ile PostgreSQL sunucu saatini çekiyoruz
        const result = await pool.query('SELECT NOW() AS current_time');
        return NextResponse.json({
            status: 'success',
            message: 'Supabase PostgreSQL bağlantısı başarılı!',
            serverTime: result.rows[0].current_time,
        });
    } catch (error: any) {
        console.error('Veritabanı bağlantı hatası:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Veritabanına bağlanılamadı',
                error: error.message,
            },
            { status: 500 }
        );
    }
}