
import { clerkMiddleware } from '@clerk/nextjs/server'


import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, request) => {

  await auth();
  request.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  request.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  request.headers.set('Access-Control-Allow-Headers', '*');
  return NextResponse.next();
  
})



export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
