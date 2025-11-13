import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Verificar se o recurso existe
    const existingResource = await prismadb.resource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    // Buscar sessões onde o recurso está na pauta
    const sessionsWithResource = await prismadb.sessionResource.findMany({
      where: {
        resourceId: id,
      },
      select: {
        sessionId: true,
      },
    });

    const sessionIds = sessionsWithResource.map(sr => sr.sessionId);

    // Buscar todas as publicações relacionadas a este recurso
    // Inclui: publicações diretas do recurso OU publicações de sessões onde o recurso está pautado
    const publications = await prismadb.publication.findMany({
      where: {
        OR: [
          { resourceId: id }, // Publicações diretas (ACORDAO, CIENCIA)
          {
            sessionId: { in: sessionIds }, // Publicações de sessão onde o recurso está pautado
            type: 'SESSAO',
          },
        ],
      },
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
          },
        },
      },
      orderBy: {
        publicationDate: 'desc',
      },
    });

    return NextResponse.json(publications);
  } catch (error) {
    console.log('[RESOURCE_PUBLICATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
