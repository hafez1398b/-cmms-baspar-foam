import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'schema';

  const filename = type === 'full' ? 'full_backup.sql' : 'schema.sql';
  const filepath = path.join(process.cwd(), 'public', 'backups', filename);

  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="cmms_${type}_${new Date().toISOString().split('T')[0]}.sql"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
