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

    const sessionData = await prismadb.session.findUnique({
      where: {
        id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        president: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resources: {
          include: {
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
          },
        },
        minutes: {
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    if (!sessionData) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.log('[SESSION_GET]', error);
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
    const {
      sessionNumber,
      sessionDate,
      type,
      startTime,
      endTime,
      observations,
      status,
    } = body;

    if (!sessionNumber) {
      return new NextResponse('Número da sessão é obrigatório', { status: 400 });
    }

    if (!sessionDate) {
      return new NextResponse('Data da sessão é obrigatória', { status: 400 });
    }

    if (!type) {
      return new NextResponse('Tipo de sessão é obrigatório', { status: 400 });
    }

    // Validar tipo
    const validTypes = ['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE'];

    if (!validTypes.includes(type)) {
      return new NextResponse('Tipo de sessão inválido', { status: 400 });
    }

    // Validar status
    const validStatuses = ['PENDENTE', 'EM_PROGRESSO', 'CONCLUIDA', 'CANCELADA'];

    if (status && !validStatuses.includes(status)) {
      return new NextResponse('Status inválido', { status: 400 });
    }

    // Verificar se a sessão existe
    const existingSession = await prismadb.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Verificar se já existe outra sessão com o mesmo número no mesmo ano
    const sessionYear = new Date(sessionDate).getFullYear();
    const duplicateSession = await prismadb.session.findFirst({
      where: {
        sessionNumber,
        date: {
          gte: new Date(`${sessionYear}-01-01`),
          lte: new Date(`${sessionYear}-12-31`),
        },
        id: {
          not: id,
        },
      },
    });

    if (duplicateSession) {
      return new NextResponse(
        `Já existe outra sessão com o número ${sessionNumber} no ano ${sessionYear}`,
        { status: 400 }
      );
    }

    const updatedSession = await prismadb.session.update({
      where: {
        id,
      },
      data: {
        sessionNumber,
        date: new Date(sessionDate),
        type,
        startTime: startTime || null,
        endTime: endTime || null,
        observations: observations || null,
        status: status || existingSession.status,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.log('[SESSION_PUT]', error);
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

    const sessionData = await prismadb.session.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            resources: true,
          },
        },
        minutes: true,
      },
    });

    if (!sessionData) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Não permitir exclusão se já tem recursos ou atas
    if (sessionData._count.resources > 0 || sessionData.minutes !== null) {
      return new NextResponse(
        'Não é possível excluir sessão com recursos ou atas registradas',
        { status: 400 }
      );
    }

    // Hard delete - Prisma vai deletar recursos em cascata
    await prismadb.session.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Sessão removida com sucesso' });
  } catch (error) {
    console.log('[SESSION_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
