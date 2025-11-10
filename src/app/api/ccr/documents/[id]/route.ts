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

    const document = await prismadb.document.findUnique({
      where: {
        id,
      },
      include: {
        resource: {
          select: {
            id: true,
            resourceNumber: true,
            year: true,
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return new NextResponse('Documento não encontrado', { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.log('[DOCUMENT_GET]', error);
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

    const document = await prismadb.document.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      return new NextResponse('Documento não encontrado', { status: 404 });
    }

    // TODO: Aqui você pode adicionar lógica para deletar o arquivo físico
    // se estiver armazenando em disco ou cloud storage
    // if (document.filePath) {
    //   await deleteFile(document.filePath);
    // }

    await prismadb.document.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Documento removido com sucesso' });
  } catch (error) {
    console.log('[DOCUMENT_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
