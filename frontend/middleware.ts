import { clerkMiddleware } from "@clerk/nextjs/server";

// We simply initialize Clerk here, but we DON'T force redirects.
// This prevents the "immutable" crash.
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};