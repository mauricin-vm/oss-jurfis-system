import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// GET /api/ccr/sessions/[id]/processos/[resourceId]/votings - Listar votações do processo
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: sessionId, resourceId } = await params;

    // Buscar o SessionResource
    const sessionResource = await prismadb.sessionResource.findFirst({
      where: {
        resourceId,
        sessionId,
      },
    });

    if (!sessionResource) {
      return NextResponse.json(
        { error: 'Processo não encontrado na sessão' },
        { status: 404 }
      );
    }

    // Buscar votações
    const votings = await prismadb.sessionVoting.findMany({
      where: {
        sessionResourceId: sessionResource.id,
      },
      include: {
        preliminarDecision: {
          select: {
            id: true,
            identifier: true,
            type: true,
          },
        },
        winningMember: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        qualityVoteMember: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        votes: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            preliminarDecision: {
              select: {
                id: true,
                identifier: true,
                type: true,
              },
            },
            meritoDecision: {
              select: {
                id: true,
                identifier: true,
                type: true,
              },
            },
            oficioDecision: {
              select: {
                id: true,
                identifier: true,
                type: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Adicionar label para cada votação
    const votingsWithLabels = votings.map((voting) => ({
      ...voting,
      label: voting.preliminarDecision
        ? `Não Conhecimento - ${voting.preliminarDecision.identifier}`
        : voting.votingType === 'NAO_CONHECIMENTO'
        ? 'Não Conhecimento'
        : 'Mérito',
    }));

    return NextResponse.json(votingsWithLabels);
  } catch (error) {
    console.log('[VOTINGS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
