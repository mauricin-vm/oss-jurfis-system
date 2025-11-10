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
    const partId = searchParams.get('partId');

    const contacts = await prismadb.contact.findMany({
      where: {
        ...(partId && { partId }),
      },
      include: {
        part: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.log('[CONTACTS_GET]', error);
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
    const { partId, type, value, isPrimary } = body;

    if (!partId) {
      return new NextResponse('Parte é obrigatória', { status: 400 });
    }

    if (!type) {
      return new NextResponse('Tipo de contato é obrigatório', { status: 400 });
    }

    if (!value) {
      return new NextResponse('Valor do contato é obrigatório', { status: 400 });
    }

    // Validar enum ContactType
    const validTypes = ['EMAIL', 'TELEFONE'];

    if (!validTypes.includes(type)) {
      return new NextResponse('Tipo de contato inválido', { status: 400 });
    }

    // Verificar se a parte existe
    const part = await prismadb.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return new NextResponse('Parte não encontrada', { status: 404 });
    }

    // Se isPrimary for true, remover isPrimary dos outros contatos da mesma parte
    if (isPrimary) {
      await prismadb.contact.updateMany({
        where: {
          partId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const contact = await prismadb.contact.create({
      data: {
        partId,
        type,
        value,
        isPrimary: isPrimary || false,
        createdBy: session.user.id,
      },
      include: {
        part: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.log('[CONTACTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
