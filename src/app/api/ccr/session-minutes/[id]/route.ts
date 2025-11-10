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

    const sessionMinutes = await prismadb.sessionMinutes.findUnique({
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
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sessionMinutes) {
      return new NextResponse('Ata não encontrada', { status: 404 });
    }

    return NextResponse.json(sessionMinutes);
  } catch (error) {
    console.log('[SESSION_MINUTES_GET]', error);
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
      minutesNumber,
      sequenceNumber,
      year,
      ordinalNumber,
      ordinalType,
      presidentId,
      endTime,
      administrativeMatters
    } = body;

    // Verificar se a ata existe
    const existingMinutes = await prismadb.sessionMinutes.findUnique({
      where: { id },
    });

    if (!existingMinutes) {
      return new NextResponse('Ata não encontrada', { status: 404 });
    }

    const sessionMinutes = await prismadb.sessionMinutes.update({
      where: {
        id,
      },
      data: {
        minutesNumber: minutesNumber || existingMinutes.minutesNumber,
        sequenceNumber: sequenceNumber !== undefined ? sequenceNumber : existingMinutes.sequenceNumber,
        year: year !== undefined ? year : existingMinutes.year,
        ordinalNumber: ordinalNumber !== undefined ? ordinalNumber : existingMinutes.ordinalNumber,
        ordinalType: ordinalType || existingMinutes.ordinalType,
        presidentId: presidentId !== undefined ? presidentId : existingMinutes.presidentId,
        endTime: endTime || existingMinutes.endTime,
        administrativeMatters: administrativeMatters !== undefined ? administrativeMatters : existingMinutes.administrativeMatters,
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
    console.log('[SESSION_MINUTES_PUT]', error);
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

    const sessionMinutes = await prismadb.sessionMinutes.findUnique({
      where: {
        id,
      },
    });

    if (!sessionMinutes) {
      return new NextResponse('Ata não encontrada', { status: 404 });
    }

    // Hard delete - atas não têm dependências críticas
    await prismadb.sessionMinutes.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Ata removida com sucesso' });
  } catch (error) {
    console.log('[SESSION_MINUTES_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
