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

    // Buscar sessão como ata
    const sessionData = await prismadb.session.findUnique({
      where: { id },
      select: {
        id: true,
        sessionNumber: true,
        sequenceNumber: true,
        year: true,
        ordinalNumber: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        minutesStatus: true,
        minutesFilePath: true,
        observations: true,
        administrativeMatters: true,
        president: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            resources: true,
          },
        },
      },
    });

    if (!sessionData) {
      return new NextResponse('Ata não encontrada', { status: 404 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error('[MINUTES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(
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

    // Verificar se a sessão existe
    const existingSession = await prismadb.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return new NextResponse('Ata não encontrada', { status: 404 });
    }

    const body = await req.json();
    const { minutesStatus, minutesFilePath, ordinalNumber } = body;

    // Atualizar apenas os campos de ata na sessão
    const updatedSession = await prismadb.session.update({
      where: { id },
      data: {
        minutesStatus: minutesStatus || existingSession.minutesStatus,
        minutesFilePath: minutesFilePath !== undefined ? minutesFilePath : existingSession.minutesFilePath,
        ordinalNumber: ordinalNumber !== undefined ? ordinalNumber : existingSession.ordinalNumber,
      },
      select: {
        id: true,
        sessionNumber: true,
        sequenceNumber: true,
        year: true,
        ordinalNumber: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        minutesStatus: true,
        minutesFilePath: true,
        president: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('[MINUTES_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
