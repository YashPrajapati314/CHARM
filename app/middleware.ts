import exp from 'constants'
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt';
 
export { default } from 'next-auth/middleware';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const url = request.nextUrl;

    if (token) {
        return NextResponse.redirect(new URL('/', request.url))
    }
}
 
export const config = {
    matcher: [
        '/',
        '/about/:path*',
        'sign-in',
        'sign-up'
    ]
}