import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Environment-based authentication (no database required)
                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPassword = process.env.ADMIN_PASSWORD;

                if (!adminEmail || !adminPassword) {
                    throw new Error(
                        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables"
                    );
                }

                if (
                    credentials?.email === adminEmail &&
                    credentials?.password === adminPassword
                ) {
                    // Return a user object on successful authentication
                    return {
                        id: "admin",
                        email: adminEmail,
                        name: "Admin",
                        role: "admin",
                    };
                }

                // Return null for invalid credentials
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
});
