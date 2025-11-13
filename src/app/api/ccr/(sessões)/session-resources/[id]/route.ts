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

    const sessionResource = await prismadb.sessionResource.findUnique({
      where: {
        id,
      },
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
            date: true,
            type: true,
            status: true,
          },
        },
        resource: {
          include: {
            protocol: true,
          },
        },
        specificPresident: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        sessionVotingResults: {
          include: {
            winningMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            sessionVotingResults: true,
          },
        },
      },
    });

    if (!sessionResource) {
      return new NextResponse('Recurso de sessão não encontrado', { status: 404 });
    }

    return NextResponse.json(sessionResource);
  } catch (error) {
    console.log('[SESSION_RESOURCE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { specificPresidentId, order, observations, status } = body;

    // Verificar se o sessionResource existe
    const existingSessionResource = await prismadb.sessionResource.findUnique({
      where: { id },
    });

    if (!existingSessionResource) {
      return new NextResponse('Recurso de sessão não encontrado', { status: 404 });
    }

    // Verificar se o presidente específico existe (se fornecido)
    if (specificPresidentId) {
      const specificPresident = await prismadb.member.findUnique({
        where: { id: specificPresidentId },
      });

      if (!specificPresident) {
        return new NextResponse('Presidente específico não encontrado', { status: 404 });
      }
    }

    // Validar status se fornecido
    if (status) {
      const validStatuses = [
        'EM_PAUTA',
        'SUSPENSO',
        'DILIGENCIA',
        'PEDIDO_VISTA',
        'JULGADO',
      ];

      if (!validStatuses.includes(status)) {
        return new NextResponse('Status inválido', { status: 400 });
      }
    }

    const sessionResource = await prismadb.sessionResource.update({
      where: {
        id,
      },
      data: {
        specificPresidentId: specificPresidentId !== undefined ? specificPresidentId : existingSessionResource.specificPresidentId,
        order: order !== undefined ? order : existingSessionResource.order,
        observations: observations !== undefined ? observations : existingSessionResource.observations,
        status: status !== undefined ? status : existingSessionResource.status,
      },
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
            date: true,
            type: true,
            status: true,
          },
        },
        resource: {
          include: {
            protocol: true,
          },
        },
        specificPresident: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            sessionVotingResults: true,
          },
        },
      },
    });

    // Se status mudou para JULGADO, atualizar status do recurso
    if (status === 'JULGADO') {
      await prismadb.resource.update({
        where: { id: existingSessionResource.resourceId },
        data: { status: 'PUBLICACAO_ACORDAO' },
      });
    }

    return NextResponse.json(sessionResource);
  } catch (error) {
    console.log('[SESSION_RESOURCE_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const sessionResource = await prismadb.sessionResource.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            sessionVotingResults: true,
          },
        },
      },
    });

    if (!sessionResource) {
      return new NextResponse('Recurso de sessão não encontrado', { status: 404 });
    }

    // Não permitir exclusão se já tem resultados de votação
    if (sessionResource._count.sessionVotingResults > 0) {
      return new NextResponse(
        'Não é possível excluir recurso de sessão com votações registradas',
        { status: 400 }
      );
    }

    // Hard delete - Prisma vai deletar relacionamentos em cascata
    await prismadb.sessionResource.delete({
      where: {
        id,
      },
    });

    // Atualizar status do recurso para DISTRIBUICAO
    await prismadb.resource.update({
      where: { id: sessionResource.resourceId },
      data: { status: 'DISTRIBUICAO' },
    });

    // Verificar se há publicações da pauta
    const hasPublications = await prismadb.publication.count({
      where: {
        sessionId: sessionResource.sessionId,
        type: 'SESSAO'
      }
    });

    // Se há publicações, mudar status da sessão para PUBLICACAO (precisa republicar)
    if (hasPublications > 0) {
      await prismadb.session.update({
        where: { id: sessionResource.sessionId },
        data: { status: 'PUBLICACAO' }
      });
    }

    return NextResponse.json({ message: 'Recurso removido da sessão com sucesso' });
  } catch (error) {
    console.log('[SESSION_RESOURCE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
