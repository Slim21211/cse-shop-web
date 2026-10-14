import { NextResponse } from 'next/server';
import net from 'net';

function check(host: string, port: number, timeout = 7000): Promise<string> {
  return new Promise((resolve) => {
    const s = new net.Socket();
    const done = (r: string) => {
      s.destroy();
      resolve(`${host}:${port} → ${r}`);
    };
    s.setTimeout(timeout);
    s.once('connect', () => done('OK'));
    s.once('timeout', () => done('TIMEOUT'));
    s.once('error', (e) => done('ERR ' + (e as Error).message));
    s.connect(port, host);
  });
}

export async function GET() {
  const results = await Promise.all([
    check('smtp.cse.ru', 587),
    check('smtp.yandex.ru', 587),
    check('smtp.cse.ru', 465),
    check('smtp.cse.ru', 25),
  ]);
  return NextResponse.json({ results });
}
