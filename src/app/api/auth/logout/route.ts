import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';
import { isSameOrigin, safeReturnPath, requestOrigin } from '@/lib/request-security';

export async function POST(request: Request) {
   if (!isSameOrigin(request)) return new NextResponse("Origen no permitido", { status: 403 });
   try {
      await deleteSession();
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
   } catch (e: unknown) {
      console.error('[API_LOGOUT] Error:', e);
      return new NextResponse('Internal Server Error', { status: 500 });
   }
}

export async function GET(request: Request) {
   if (!isSameOrigin(request)) return new NextResponse("Origen no permitido", { status: 403 });
   try {
      await deleteSession({ deferRevocation: true });
   } catch (e) {
      console.error('[API_LOGOUT] Error borrando sesión:', e);
   }

   const { searchParams } = new URL(request.url);
   const callbackUrl = safeReturnPath(searchParams.get('callbackUrl'), '/login');

   return NextResponse.redirect(new URL(callbackUrl, requestOrigin(request)));
}
