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

    const resource = await prismadb.resource.findUnique({
      where: {
        id,
      },
      include: {
        protocol: {
          include: {
            parts: {
              include: {
                contacts: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        parts: {
          include: {
            contacts: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                description: true,
                parentId: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        registrations: {
          include: {
            values: true,
          },
        },
        authorities: true,
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
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        sessions: {
          include: {
            session: {
              select: {
                id: true,
                sessionNumber: true,
                date: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            tramitations: true,
            documents: true,
            sessions: true,
            registrations: true,
            subjects: true,
            parts: true,
          },
        },
      },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.log('[RESOURCE_GET]', error);
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
    const { status } = body;

    // Verificar se o recurso existe
    const existingResource = await prismadb.resource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    // Validar enum de status se fornecido
    if (status) {
      const validStatuses = [
        'EM_ANALISE',
        'TEMPESTIVIDADE',
        'CONTRARRAZAO',
        'PARECER_PGM',
        'DISTRIBUICAO',
        'NOTIFICACAO_JULGAMENTO',
        'JULGAMENTO',
        'DILIGENCIA',
        'PEDIDO_VISTA',
        'SUSPENSO',
        'PUBLICACAO_ACORDAO',
        'ASSINATURA_ACORDAO',
        'NOTIFICACAO_DECISAO',
        'CONCLUIDO',
      ];

      if (!validStatuses.includes(status)) {
        return new NextResponse('Status inválido', { status: 400 });
      }
    }

    const resource = await prismadb.resource.update({
      where: {
        id,
      },
      data: {
        ...(status && { status }),
      },
      include: {
        protocol: true,
        _count: {
          select: {
            tramitations: true,
            documents: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.log('[RESOURCE_PUT]', error);
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

    const resource = await prismadb.resource.findUnique({
      where: {
        id,
      },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    // Deletar recurso - cascade delete irá remover relacionamentos
    await prismadb.resource.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Recurso removido com sucesso' });
  } catch (error) {
    console.log('[RESOURCE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
