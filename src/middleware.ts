import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas que requerem autenticação
const protectedApiRoutes = [
  '/api/overtime',
  '/api/meetings/admin',
  '/api/meetings/requests',
];

const protectedPageRoutes = [
  '/horas-extras',
  '/chat',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida (API ou página)
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));
  const isProtectedPage = protectedPageRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedApi && !isProtectedPage) {
    return NextResponse.next();
  }

  // Obter token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Se não há token ou token é inválido
  if (!token) {
    if (isProtectedApi) {
      // Para APIs: retornar 401 com erro específico
      return NextResponse.json(
        {
          success: false,
          error: 'Sessão inválida ou expirada',
          code: 'SESSION_INVALID'
        },
        { status: 401 }
      );
    } else {
      // Para páginas: apenas continuar (a página vai lidar com o estado não autenticado)
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/overtime/:path*',
    '/api/meetings/admin/:path*',
    '/api/meetings/requests/:path*',
    '/horas-extras/:path*',
    '/chat/:path*',
  ],
};
