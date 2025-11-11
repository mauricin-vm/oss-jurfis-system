import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessMembers, canEditMember, canDeleteMember } from '@/lib/permissions';

// GET /api/ccr/authorities-registered/[id] - Busca uma autoridade específica
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canAccessMembers(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const authority = await prismadb.authorityRegistered.findUnique({
      where: {
        id,
      },
    });

    if (!authority) {
      return new NextResponse('Autoridade não encontrada', { status: 404 });
    }

    return NextResponse.json(authority);
  } catch (error) {
    console.log('[AUTHORITY_REGISTERED_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/ccr/authorities-registered/[id] - Atualiza uma autoridade
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canEditMember(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, isActive } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    // Verificar se a autoridade existe
    const existingAuthority = await prismadb.authorityRegistered.findUnique({
      where: { id },
    });

    if (!existingAuthority) {
      return new NextResponse('Autoridade não encontrada', { status: 404 });
    }

    const authority = await prismadb.authorityRegistered.update({
      where: {
        id,
      },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(authority);
  } catch (error) {
    console.log('[AUTHORITY_REGISTERED_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/ccr/authorities-registered/[id] - Remove uma autoridade
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canDeleteMember(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    // Verificar se a autoridade existe
    const existingAuthority = await prismadb.authorityRegistered.findUnique({
      where: { id },
    });

    if (!existingAuthority) {
      return new NextResponse('Autoridade não encontrada', { status: 404 });
    }

    // Verificar se a autoridade está vinculada a algum recurso
    const authorityUsage = await prismadb.authority.findFirst({
      where: { authorityRegisteredId: id },
    });

    if (authorityUsage) {
      return new NextResponse('Não é possível excluir esta autoridade pois ela está vinculada a um ou mais recursos', { status: 400 });
    }

    // Deletar permanentemente
    await prismadb.authorityRegistered.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Autoridade removida com sucesso' });
  } catch (error) {
    console.log('[AUTHORITY_REGISTERED_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
