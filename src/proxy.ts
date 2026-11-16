import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { apexDomainConfigured, isLegacyHost, publicSiteOrigin } from "@/shared/site-origin";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.toLowerCase() ?? request.nextUrl.hostname;
  // Auth links and API requests stay on the host that issued them.
  const isPageRequest = ["GET", "HEAD"].includes(request.method)
    && !/^\/(?:api|auth)(?:\/|$)/.test(request.nextUrl.pathname);
  if (isPageRequest && apexDomainConfigured() && isLegacyHost(hostname)) {
    const target = new URL(publicSiteOrigin());
    target.pathname = request.nextUrl.pathname;
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // Refresh the Supabase token when accounts are configured.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // The point of the whole function: this call refreshes the token.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
