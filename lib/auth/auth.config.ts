import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Edge-compatible configuration (no Prisma/Database adapters here)
export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/error",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isPublicPath =
                nextUrl.pathname === "/" ||
                nextUrl.pathname.startsWith("/login") ||
                nextUrl.pathname.startsWith("/signup") ||
                nextUrl.pathname.startsWith("/api") ||
                nextUrl.pathname.startsWith("/_next") ||
                nextUrl.pathname.includes(".") // Static files

            if (isPublicPath) {
                return true
            }

            // For protected routes, require login
            return isLoggedIn
        },
        async session({ session, user }) {
            if (session.user && user) {
                session.user.id = user.id
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
    },
} satisfies NextAuthConfig
