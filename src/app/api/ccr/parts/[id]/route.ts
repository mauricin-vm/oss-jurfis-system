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

    const part = await prismadb.part.findUnique({
      where: {
        id,
      },
      include: {
        contacts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    if (!part) {
      return new NextResponse('Parte não encontrada', { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.log('[PART_GET]', error);
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
    const { name, role, document } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    if (!role) {
      return new NextResponse('Tipo de parte é obrigatório', { status: 400 });
    }

    // Validar enum PartRole
    const validRoles = ['REQUERENTE', 'PATRONO', 'REPRESENTANTE', 'OUTRO'];

    if (!validRoles.includes(role)) {
      return new NextResponse('Tipo de parte inválido', { status: 400 });
    }

    // Verificar se a parte existe
    const existingPart = await prismadb.part.findUnique({
      where: { id },
    });

    if (!existingPart) {
      return new NextResponse('Parte não encontrada', { status: 404 });
    }

    const part = await prismadb.part.update({
      where: {
        id,
      },
      data: {
        name,
        role,
        document: document || null,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    return NextResponse.json(part);
  } catch (error) {
    console.log('[PART_PUT]', error);
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

    const part = await prismadb.part.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    if (!part) {
      return new NextResponse('Parte não encontrada', { status: 404 });
    }

    // Hard delete - Cascade delete irá remover contatos automaticamente
    await prismadb.part.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Parte removida com sucesso' });
  } catch (error) {
    console.log('[PART_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
