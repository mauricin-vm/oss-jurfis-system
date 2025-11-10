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
      specificPresidentId,
      order,
      observations,
    } = body;

    if (!sessionId) {
      return new NextResponse('Sessão é obrigatória', { status: 400 });
    }

    if (!resourceId) {
      return new NextResponse('Recurso é obrigatório', { status: 400 });
    }

    // Verificar se a sessão existe
    const sessionData = await prismadb.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Verificar se o recurso existe
    const resource = await prismadb.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
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

    const sessionResource = await prismadb.sessionResource.create({
      data: {
        sessionId,
        resourceId,
        specificPresidentId: specificPresidentId || null,
        order: finalOrder,
        status: 'EM_PAUTA',
        observations: observations || null,
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

    // Atualizar status do recurso para JULGAMENTO
    await prismadb.resource.update({
      where: { id: resourceId },
      data: { status: 'JULGAMENTO' },
    });

    return NextResponse.json(sessionResource);
  } catch (error) {
    console.log('[SESSION_RESOURCES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
