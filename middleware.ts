import { auth } from "@/auth";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/admin")) return;
  if (path.startsWith("/admin/login")) return;
  if (!req.auth) {
    return Response.redirect(new URL("/admin/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
