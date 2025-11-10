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
    const resourceId = searchParams.get('resourceId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const notifications = await prismadb.notification.findMany({
      where: {
        ...(resourceId && { resourceId }),
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.log('[NOTIFICATIONS_GET]', error);
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
      resourceId,
      type,
      sectorId,
      destination,
      subject,
      message,
      scheduledFor,
    } = body;

    if (!resourceId) {
      return new NextResponse('Recurso é obrigatório', { status: 400 });
    }

    if (!type) {
      return new NextResponse('Tipo de notificação é obrigatório', { status: 400 });
    }

    if (!subject) {
      return new NextResponse('Assunto é obrigatório', { status: 400 });
    }

    if (!message) {
      return new NextResponse('Mensagem é obrigatória', { status: 400 });
    }

    // Validar tipo
    const validTypes = [
      'ADMISSIBILIDADE',
      'SESSAO',
      'DILIGENCIA',
      'DECISAO',
      'OUTRO',
    ];

    if (!validTypes.includes(type)) {
      return new NextResponse('Tipo de notificação inválido', { status: 400 });
    }

    // Verificar se o recurso existe
    const resource = await prismadb.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    const notification = await prismadb.notification.create({
      data: {
        resourceId,
        type,
        sectorId: sectorId || null,
        destination: destination || null,
        subject,
        message,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: 'PENDENTE',
        createdBy: session.user.id,
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
    console.log('[NOTIFICATIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
