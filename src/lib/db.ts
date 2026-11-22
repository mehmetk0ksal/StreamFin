import { Pool, QueryResult, QueryResultRow } from 'pg';

const globalForPg = globalThis as unknown as {
    pgPool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL;
const local = connectionString && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString).hostname);

export const pool =
    globalForPg.pgPool ??
    new Pool({
        connectionString,
        ssl: local ? false : {
            rejectUnauthorized: false, // Supabase SSL bağlantısı için gerekli
        },
        max: 10,
        connectionTimeoutMillis: 5000,
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPg.pgPool = pool;
}

/**
 * Tüm manuel SQL sorguları bu fonksiyon üzerinden parametreli ($1, $2...) çalıştırılır.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
}
