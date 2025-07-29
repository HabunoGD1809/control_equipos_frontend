import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
   try {
      const cookieStore = await cookies();

      cookieStore.set('access_token', '', { expires: new Date(0), path: '/' });
      cookieStore.set('refresh_token', '', { expires: new Date(0), path: '/' });

      return NextResponse.json({ message: 'Logged out successfully' });
   } catch (e: unknown) {
      console.error('[API LOGOUT ERROR]', e);
      return new NextResponse('Internal Server Error', { status: 500 });
   }
}  
