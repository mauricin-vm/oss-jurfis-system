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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    const sessions = await prismadb.session.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
        ...(year && {
          date: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`),
          },
        }),
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
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.log('[SESSIONS_GET]', error);
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
      sessionNumber,
      sessionDate,
      type,
      startTime,
      endTime,
      observations,
      presidentId,
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

    if (!presidentId) {
      return new NextResponse('Presidente é obrigatório', { status: 400 });
    }

    // Validar tipo
    const validTypes = ['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE'];

    if (!validTypes.includes(type)) {
      return new NextResponse('Tipo de sessão inválido', { status: 400 });
    }

    // Verificar se já existe sessão com o mesmo número no mesmo ano
    const sessionYear = new Date(sessionDate).getFullYear();
    const existingSession = await prismadb.session.findFirst({
      where: {
        sessionNumber,
        date: {
          gte: new Date(`${sessionYear}-01-01`),
          lte: new Date(`${sessionYear}-12-31`),
        },
      },
    });

    if (existingSession) {
      return new NextResponse(
        `Já existe uma sessão com o número ${sessionNumber} no ano ${sessionYear}`,
        { status: 400 }
      );
    }

    const newSession = await prismadb.session.create({
      data: {
        sessionNumber,
        date: new Date(sessionDate),
        type,
        startTime: startTime || null,
        endTime: endTime || null,
        observations: observations || null,
        status: 'PENDENTE',
        presidentId,
        createdBy: session.user.id,
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

    return NextResponse.json(newSession);
  } catch (error) {
    console.log('[SESSIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
