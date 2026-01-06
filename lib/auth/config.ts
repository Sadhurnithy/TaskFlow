import NextAuth from "next-auth"
// Force rebuild
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/db/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // Update session expiry only once every 24 hours
    },
    pages: {
        signIn: "/login",
        error: "/error",
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user && user) {
                // @ts-ignore
                session.user.id = user.id
                // @ts-ignore
                session.user.image = user.image
            }
            return session
        },
    },
    debug: false,
    trustHost: true,
    secret: process.env.NEXTAUTH_SECRET,
})
