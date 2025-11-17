import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const resourceId = searchParams.get('resourceId');

    const sessionResources = await prismadb.sessionResource.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(resourceId && { resourceId }),
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
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(sessionResources);
  } catch (error) {
    console.log('[SESSION_RESOURCES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      sessionId,
      resourceId,
      memberId,
      order,
    } = body;

    if (!sessionId) {
      return new NextResponse('Sessão é obrigatória', { status: 400 });
    }

    if (!resourceId) {
      return new NextResponse('Recurso é obrigatório', { status: 400 });
    }

    if (!memberId) {
      return new NextResponse('Membro é obrigatório', { status: 400 });
    }

    // Verificar se a sessão existe
    const sessionData = await prismadb.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Verificar se o recurso existe e buscar suas distribuições ativas
    const resource = await prismadb.resource.findUnique({
      where: { id: resourceId },
      include: {
        distributions: {
          where: {
            isActive: true,
          },
          include: {
            member: true,
          },
        },
      },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    // Verificar se o membro existe
    const member = await prismadb.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return new NextResponse('Membro não encontrado', { status: 404 });
    }

    // Verificar se o recurso já está na sessão
    const existingSessionResource = await prismadb.sessionResource.findFirst({
      where: {
        sessionId,
        resourceId,
      },
    });

    if (existingSessionResource) {
      return new NextResponse(
        'Este recurso já está vinculado a esta sessão',
        { status: 400 }
      );
    }

    // Se não foi fornecida ordem, colocar no final
    let finalOrder = order;
    if (!finalOrder) {
      const lastResource = await prismadb.sessionResource.findFirst({
        where: { sessionId },
        orderBy: { order: 'desc' },
      });
      finalOrder = lastResource ? lastResource.order + 1 : 1;
    }

    // Criar SessionResource
    const sessionResource = await prismadb.sessionResource.create({
      data: {
        sessionId,
        resourceId,
        specificPresidentId: null, // Será preenchido no resultado se houver mudança de presidente
        order: finalOrder,
        status: 'EM_PAUTA',
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

    // Criar registros em SessionDistribution
    // Buscar a ordem da última distribuição na sessão
    const lastDistribution = await prismadb.sessionDistribution.findFirst({
      where: { sessionId },
      orderBy: { distributionOrder: 'desc' },
    });

    let distributionOrder = lastDistribution ? lastDistribution.distributionOrder + 1 : 1;

    // Buscar a última distribuição deste recurso (se existir) para copiar o estado
    const lastResourceDistribution = await prismadb.sessionDistribution.findFirst({
      where: {
        resourceId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        firstDistributionId: true,
        reviewersIds: true,
      },
    });

    // Estado atual das distribuições (copiado da última ou iniciado)
    let currentFirstDistributionId = lastResourceDistribution?.firstDistributionId || null;
    let currentReviewersIds = lastResourceDistribution?.reviewersIds || [];

    // Determinar se o membro selecionado vira primeiro membro (relator) ou revisor
    if (!currentFirstDistributionId) {
      // Não há primeiro membro ainda, o membro selecionado será o primeiro (relator)
      currentFirstDistributionId = memberId;
    } else if (currentFirstDistributionId !== memberId && !currentReviewersIds.includes(memberId)) {
      // Adicionar como novo revisor (se não for o primeiro membro e não estiver já na lista)
      currentReviewersIds = [...currentReviewersIds, memberId];
    }

    // Criar o registro de distribuição com o estado completo
    await prismadb.sessionDistribution.create({
      data: {
        resourceId,
        sessionId,
        firstDistributionId: currentFirstDistributionId,
        distributedToId: memberId,
        reviewersIds: currentReviewersIds,
        distributionOrder,
        isActive: true,
      },
    });

    // Atualizar status do recurso para JULGAMENTO
    await prismadb.resource.update({
      where: { id: resourceId },
      data: { status: 'JULGAMENTO' },
    });

    // Verificar se há publicações da pauta
    const hasPublications = await prismadb.publication.count({
      where: {
        sessionId,
        type: 'SESSAO'
      }
    });

    // Se há publicações, mudar status da sessão para PUBLICACAO (precisa republicar)
    if (hasPublications > 0) {
      await prismadb.session.update({
        where: { id: sessionId },
        data: { status: 'PUBLICACAO' }
      });
    }

    return NextResponse.json(sessionResource);
  } catch (error) {
    console.log('[SESSION_RESOURCES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
