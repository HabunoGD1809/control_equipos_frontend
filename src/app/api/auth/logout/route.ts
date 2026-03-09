import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST() {
   try {
      await deleteSession();
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
   } catch (e: unknown) {
      console.error('[API_LOGOUT] Error:', e);
      return new NextResponse('Internal Server Error', { status: 500 });
   }
}

export async function GET(request: Request) {
   try {
      await deleteSession();
   } catch (e) {
      console.error('[API_LOGOUT] Error borrando sesión:', e);
   }

   const { searchParams } = new URL(request.url);
   const callbackUrl = searchParams.get('callbackUrl') || '/login';

   return NextResponse.redirect(new URL(callbackUrl, request.url));
}
