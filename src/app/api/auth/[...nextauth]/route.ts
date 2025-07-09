import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://admin:leDFbq2cPiftMKLM2yjq4c1OJ8gbbkMz@dpg-d1n6ae6mcj7s73bnhdtg-a.oregon-postgres.render.com/fullstack_rwoe?ssl=true";

async function getUserByEmail(email: string) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT * FROM users WHERE email = $1", [email]);
  await client.end();
  return res.rows[0];
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await getUserByEmail(credentials.email);
        if (!user) return null;
        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) return null;
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "devsecret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 