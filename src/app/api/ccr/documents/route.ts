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

    const documents = await prismadb.document.findMany({
      where: {
        ...(resourceId && { resourceId }),
        ...(type && { type: type as any }),
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
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.log('[DOCUMENTS_GET]', error);
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
      title,
      description,
      fileName,
      fileSize,
      mimeType,
      filePath,
    } = body;

    if (!resourceId) {
      return new NextResponse('Recurso é obrigatório', { status: 400 });
    }

    if (!type) {
      return new NextResponse('Tipo de documento é obrigatório', { status: 400 });
    }

    if (!title) {
      return new NextResponse('Título é obrigatório', { status: 400 });
    }

    if (!fileName) {
      return new NextResponse('Nome do arquivo é obrigatório', { status: 400 });
    }

    // Validar tipo de documento
    const validTypes = [
      'PETICAO_INICIAL',
      'PROCURACAO',
      'DOCUMENTO_IDENTIFICACAO',
      'COMPROVANTE_RESIDENCIA',
      'DOCUMENTO_FISCAL',
      'PARECER_TECNICO',
      'DECISAO',
      'OUTROS',
    ];

    if (!validTypes.includes(type)) {
      return new NextResponse('Tipo de documento inválido', { status: 400 });
    }

    // Verificar se o recurso existe
    const resource = await prismadb.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    const document = await prismadb.document.create({
      data: {
        resourceId,
        type,
        title,
        description: description || null,
        fileName,
        storedFileName: fileName, // Nome do arquivo armazenado (pode ser diferente do original)
        fileSize,
        mimeType,
        filePath,
        uploadedBy: session.user.id,
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

    return NextResponse.json(document);
  } catch (error) {
    console.log('[DOCUMENTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
