import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

// Live dump of the current database schema/data via pg_dump
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'schema'; // schema | full

  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/app_db';

  try {
    const args = [
      'pg_dump',
      dbUrl,
      '--no-owner',
      '--no-privileges',
    ];
    if (type === 'schema') args.push('--schema-only');

    const output = execSync(args.join(' '), {
      maxBuffer: 50 * 1024 * 1024, // 50 MB
      encoding: 'utf-8',
    });

    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="cmms_${type}_${date}_${time}.sql"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to generate dump' }, { status: 500 });
  }
}
