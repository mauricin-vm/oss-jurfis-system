//importar bibliotecas e funções
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';

//definir prisma
const prisma = new PrismaClient();
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: `credentials`,
      credentials: {
        email: { label: `Email`, type: `email` },
        password: { label: `Password`, type: `password` }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null;

        // Buscar a primeira organização do usuário
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId: user.id },
          include: { organization: true }
        });

        if (!orgMember) {
          // Usuário sem organização não pode fazer login
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: orgMember.role,
          organizationId: orgMember.organizationId,
          organizationName: orgMember.organization.name,
        };
      }
    })
  ],
  session: {
    strategy: `jwt`
  },
  pages: {
    signIn: `/auth/signin`,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
        };
      }
      return token;
    },
    async session({ token, session }) {
      if (!token || !token.email) {
        return session;
      }

      // Validar se o usuário ainda existe no banco
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          include: {
            organizationMembers: {
              include: {
                organization: true
              }
            }
          }
        });

        // Se usuário não existe mais ou não tem organização, retornar sessão vazia
        if (!dbUser || dbUser.organizationMembers.length === 0) {
          return {
            ...session,
            user: undefined as any,
            expires: new Date(0).toISOString(), // Expirar sessão
          };
        }

        // Atualizar dados da sessão com informações atualizadas
        const orgMember = dbUser.organizationMembers[0];
        return {
          ...session,
          user: {
            ...session.user,
            id: dbUser.id, // Usar o ID do banco de dados ao invés do token
            email: dbUser.email,
            name: dbUser.name,
            role: orgMember.role,
            organizationId: orgMember.organizationId,
            organizationName: orgMember.organization.name,
          }
        };
      } catch (error) {
        console.error('Erro ao validar sessão:', error);
        // Em caso de erro, retornar sessão básica sem validação
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role,
            organizationId: token.organizationId,
            organizationName: token.organizationName,
          }
        };
      }
    }
  }
};