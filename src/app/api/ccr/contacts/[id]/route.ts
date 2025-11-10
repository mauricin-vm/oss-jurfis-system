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

    const contact = await prismadb.contact.findUnique({
      where: {
        id,
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

    if (!contact) {
      return new NextResponse('Contato não encontrado', { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.log('[CONTACT_GET]', error);
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

    // Validar enum
    const validTypes = ['EMAIL', 'TELEFONE'];

    if (!validTypes.includes(type)) {
      return new NextResponse('Tipo de contato inválido', { status: 400 });
    }

    // Verificar se o contato existe
    const existingContact = await prismadb.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return new NextResponse('Contato não encontrado', { status: 404 });
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
          id: {
            not: id, // Excluir o contato atual
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const contact = await prismadb.contact.update({
      where: {
        id,
      },
      data: {
        partId,
        type,
        value,
        isPrimary,
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
    console.log('[CONTACT_PUT]', error);
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

    const contact = await prismadb.contact.findUnique({
      where: {
        id,
      },
    });

    if (!contact) {
      return new NextResponse('Contato não encontrado', { status: 404 });
    }

    // Contacts não têm relacionamentos em cascata, então sempre hard delete
    await prismadb.contact.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Contato removido com sucesso' });
  } catch (error) {
    console.log('[CONTACT_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
