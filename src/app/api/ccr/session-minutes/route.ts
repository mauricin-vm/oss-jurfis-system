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

    const minutes = await prismadb.sessionMinutes.findMany({
      where: {
        ...(sessionId && { sessionId }),
      },
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
            date: true,
            type: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(minutes);
  } catch (error) {
    console.log('[SESSION_MINUTES_GET]', error);
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
      minutesNumber,
      sequenceNumber,
      year,
      ordinalNumber,
      ordinalType,
      presidentId,
      endTime,
      administrativeMatters,
    } = body;

    if (!sessionId) {
      return new NextResponse('Sessão é obrigatória', { status: 400 });
    }

    if (!minutesNumber) {
      return new NextResponse('Número da ata é obrigatório', { status: 400 });
    }

    if (!sequenceNumber) {
      return new NextResponse('Número sequencial é obrigatório', { status: 400 });
    }

    if (!year) {
      return new NextResponse('Ano é obrigatório', { status: 400 });
    }

    if (!ordinalNumber) {
      return new NextResponse('Número ordinal é obrigatório', { status: 400 });
    }

    if (!ordinalType) {
      return new NextResponse('Tipo ordinal é obrigatório', { status: 400 });
    }

    if (!endTime) {
      return new NextResponse('Horário de término é obrigatório', { status: 400 });
    }

    // Verificar se a sessão existe
    const sessionData = await prismadb.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Verificar se já existe ata para esta sessão
    const existingMinutes = await prismadb.sessionMinutes.findFirst({
      where: { sessionId },
    });

    if (existingMinutes) {
      return new NextResponse(
        'Já existe uma ata para esta sessão',
        { status: 400 }
      );
    }

    const sessionMinutes = await prismadb.sessionMinutes.create({
      data: {
        sessionId,
        minutesNumber,
        sequenceNumber,
        year,
        ordinalNumber,
        ordinalType,
        presidentId: presidentId || null,
        endTime,
        administrativeMatters: administrativeMatters || null,
        createdBy: session.user.id,
      },
      include: {
        session: {
          select: {
            id: true,
            sessionNumber: true,
            date: true,
            type: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(sessionMinutes);
  } catch (error) {
    console.log('[SESSION_MINUTES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
