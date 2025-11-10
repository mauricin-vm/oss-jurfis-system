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

    const notification = await prismadb.notification.findUnique({
      where: {
        id,
      },
      include: {
        resource: {
          include: {
            protocol: true,
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

    if (!notification) {
      return new NextResponse('Notificação não encontrada', { status: 404 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.log('[NOTIFICATION_GET]', error);
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
      type,
      sectorId,
      destination,
      subject,
      message,
      scheduledFor,
      status,
    } = body;

    // Verificar se a notificação existe
    const existingNotification = await prismadb.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return new NextResponse('Notificação não encontrada', { status: 404 });
    }

    // Validar status se fornecido
    if (status) {
      const validStatuses = ['PENDENTE', 'ENVIADO', 'ERRO', 'AGENDADO'];

      if (!validStatuses.includes(status)) {
        return new NextResponse('Status inválido', { status: 400 });
      }
    }

    const notification = await prismadb.notification.update({
      where: {
        id,
      },
      data: {
        type: type || existingNotification.type,
        sectorId: sectorId !== undefined ? sectorId : existingNotification.sectorId,
        destination: destination !== undefined ? destination : existingNotification.destination,
        subject: subject || existingNotification.subject,
        message: message || existingNotification.message,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : existingNotification.scheduledFor,
        status: status || existingNotification.status,
      },
      include: {
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            year: true,
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

    return NextResponse.json(notification);
  } catch (error) {
    console.log('[NOTIFICATION_PUT]', error);
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

    const notification = await prismadb.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      return new NextResponse('Notificação não encontrada', { status: 404 });
    }

    // Hard delete
    await prismadb.notification.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Notificação removida com sucesso' });
  } catch (error) {
    console.log('[NOTIFICATION_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
