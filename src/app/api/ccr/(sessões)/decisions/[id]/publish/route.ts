import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verificar se é EXTERNAL
    if (session.user.role === 'EXTERNAL') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const decision = await prismadb.decision.findUnique({
      where: { id },
      include: {
        publications: {
          orderBy: {
            publicationOrder: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!decision) {
      return new NextResponse('Acórdão não encontrado', { status: 404 });
    }

    const body = await req.json();
    const { publicationNumber, publicationDate, republishReason } = body;

    if (!publicationNumber) {
      return new NextResponse('Número da publicação é obrigatório', { status: 400 });
    }

    if (!publicationDate) {
      return new NextResponse('Data da publicação é obrigatória', { status: 400 });
    }

    // Determinar a ordem da publicação
    const lastPublicationOrder = decision.publications[0]?.publicationOrder || 0;
    const publicationOrder = lastPublicationOrder + 1;

    // Se é republicação (ordem > 1), motivo é obrigatório
    if (publicationOrder > 1 && !republishReason) {
      return new NextResponse('Motivo da republicação é obrigatório', { status: 400 });
    }

    // Criar o registro de publicação com snapshot do conteúdo atual
    const publication = await prismadb.decisionPublication.create({
      data: {
        decisionId: id,
        publicationOrder,
        publicationNumber,
        publicationDate: new Date(publicationDate),
        ementaTitleSnapshot: decision.ementaTitle,
        ementaBodySnapshot: decision.ementaBody,
        republishReason: republishReason || null,
      },
    });

    // Atualizar status do acórdão
    const newStatus = publicationOrder > 1 ? 'REPUBLICADO' : 'PUBLICADO';

    await prismadb.decision.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    // Retornar o acórdão atualizado com as publicações
    const updatedDecision = await prismadb.decision.findUnique({
      where: { id },
      include: {
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            processNumber: true,
            processName: true,
          },
        },
        publications: {
          orderBy: {
            publicationOrder: 'desc',
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDecision);
  } catch (error) {
    console.error('[DECISION_PUBLISH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
