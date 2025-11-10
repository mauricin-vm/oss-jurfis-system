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

    const publication = await prismadb.publication.findUnique({
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

    if (!publication) {
      return new NextResponse('Publicação não encontrada', { status: 404 });
    }

    return NextResponse.json(publication);
  } catch (error) {
    console.log('[PUBLICATION_GET]', error);
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
      publicationNumber,
      publicationDate,
      observations,
    } = body;

    // Verificar se a publicação existe
    const existingPublication = await prismadb.publication.findUnique({
      where: { id },
    });

    if (!existingPublication) {
      return new NextResponse('Publicação não encontrada', { status: 404 });
    }

    // Validar tipo se fornecido
    if (type) {
      const validTypes = ['SESSAO', 'CIENCIA', 'OUTRO'];

      if (!validTypes.includes(type)) {
        return new NextResponse('Tipo de publicação inválido', { status: 400 });
      }
    }

    const publication = await prismadb.publication.update({
      where: {
        id,
      },
      data: {
        type: type || existingPublication.type,
        publicationNumber: publicationNumber || existingPublication.publicationNumber,
        publicationDate: publicationDate
          ? new Date(publicationDate)
          : existingPublication.publicationDate,
        observations: observations !== undefined ? observations : existingPublication.observations,
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

    return NextResponse.json(publication);
  } catch (error) {
    console.log('[PUBLICATION_PUT]', error);
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

    const publication = await prismadb.publication.findUnique({
      where: {
        id,
      },
    });

    if (!publication) {
      return new NextResponse('Publicação não encontrada', { status: 404 });
    }

    // Hard delete
    await prismadb.publication.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Publicação removida com sucesso' });
  } catch (error) {
    console.log('[PUBLICATION_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
