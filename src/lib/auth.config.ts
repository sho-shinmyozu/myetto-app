import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const publicPaths = ["/login", "/register"];
      const isPublic = publicPaths.some((p) => pathname.startsWith(p));
      const isApi = pathname.startsWith("/api/");

      if (isApi) return true;
      if (!isLoggedIn && !isPublic) return false;
      if (isLoggedIn && isPublic) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingDone = (user as { onboardingDone?: boolean }).onboardingDone ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { onboardingDone?: boolean }).onboardingDone =
          token.onboardingDone as boolean;
      }
      return session;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
};
