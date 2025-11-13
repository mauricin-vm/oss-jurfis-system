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

    // Verificar se a sessão existe
    const existingSession = await prismadb.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Buscar apenas as publicações do tipo SESSAO relacionadas a esta sessão
    const publications = await prismadb.publication.findMany({
      where: {
        sessionId: id,
        type: 'SESSAO',
      },
      include: {
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            processNumber: true,
          },
        },
      },
      orderBy: {
        publicationDate: 'desc',
      },
    });

    return NextResponse.json(publications);
  } catch (error) {
    console.log('[SESSION_PUBLICATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
