import { NextRequest, NextResponse } from 'next/server';
import { boundedBody } from '@/lib/request-body';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export async function GET(_request: NextRequest, context: { params: Promise<{ file: string }> }) {
   const { file } = await context.params;
   if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,120}\.(?:png|jpe?g|webp)$/i.test(file)) return new NextResponse(null, { status: 404 });
   const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
   if (!token) return new NextResponse(null, { status: 401 });
   const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
   if (!base) return new NextResponse(null, { status: 503 });
   try {
      const upstream = await fetch(`${base.replace(/\/$/, '')}/usuarios/avatar/${encodeURIComponent(file)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000), cache: 'no-store' });
      if (!upstream.ok) return new NextResponse(null, { status: [401, 403, 404].includes(upstream.status) ? upstream.status : 502 });
      const mime = upstream.headers.get('content-type') || '';
      if (!/^image\/(?:png|jpeg|webp)/i.test(mime)) return new NextResponse(null, { status: 502 });
      const body = await boundedBody(upstream, 3 * 1024 * 1024);
      if (!body) return new NextResponse(null, { status: 502 });
      return new NextResponse(body.buffer as ArrayBuffer, { headers: { 'Content-Type': mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
   } catch { return new NextResponse(null, { status: 502 }); }
}
