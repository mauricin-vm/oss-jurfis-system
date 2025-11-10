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

    const protocol = await prismadb.protocol.findUnique({
      where: {
        id,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parts: {
          include: {
            contacts: true,
          },
        },
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            status: true,
          },
        },
        tramitations: {
          include: {
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            parts: true,
            tramitations: true,
          },
        },
      },
    });

    if (!protocol) {
      return new NextResponse('Protocolo não encontrado', { status: 404 });
    }

    return NextResponse.json(protocol);
  } catch (error) {
    console.log('[PROTOCOL_GET]', error);
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
    const { processNumber, presenter, status, analysisDate, isAdmittedAsResource, rejectionReason } = body;

    // Verificar se o protocolo existe
    const existingProtocol = await prismadb.protocol.findUnique({
      where: { id },
      include: {
        resource: true,
      },
    });

    if (!existingProtocol) {
      return new NextResponse('Protocolo não encontrado', { status: 404 });
    }

    // Se já foi convertido em recurso, não permitir algumas alterações
    if (existingProtocol.resource) {
      return new NextResponse('Protocolo já foi convertido em recurso', { status: 400 });
    }

    // Validar enum de status
    if (status) {
      const validStatuses = ['PENDENTE', 'CONCLUIDO', 'ARQUIVADO'];
      if (!validStatuses.includes(status)) {
        return new NextResponse('Status inválido', { status: 400 });
      }
    }

    const protocol = await prismadb.protocol.update({
      where: {
        id,
      },
      data: {
        ...(processNumber && { processNumber }),
        ...(presenter && { presenter }),
        ...(status && { status }),
        ...(analysisDate !== undefined && { analysisDate: analysisDate ? new Date(analysisDate) : null }),
        ...(isAdmittedAsResource !== undefined && { isAdmittedAsResource }),
        ...(rejectionReason !== undefined && { rejectionReason }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parts: true,
        resource: true,
        _count: {
          select: {
            parts: true,
            tramitations: true,
          },
        },
      },
    });

    return NextResponse.json(protocol);
  } catch (error) {
    console.log('[PROTOCOL_PUT]', error);
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

    const protocol = await prismadb.protocol.findUnique({
      where: {
        id,
      },
      include: {
        resource: true,
        tramitations: true,
      },
    });

    if (!protocol) {
      return new NextResponse('Protocolo não encontrado', { status: 404 });
    }

    // Não permitir deletar se já foi convertido em recurso
    if (protocol.resource) {
      return new NextResponse(
        'Não é possível deletar protocolo que já foi convertido em recurso',
        { status: 400 }
      );
    }

    // Delete - cascade delete irá remover tramitations
    await prismadb.protocol.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Protocolo removido com sucesso' });
  } catch (error) {
    console.log('[PROTOCOL_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
