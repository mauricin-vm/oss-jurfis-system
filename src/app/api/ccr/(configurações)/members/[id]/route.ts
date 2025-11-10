import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessMembers, canEditMember, canDeleteMember } from '@/lib/permissions';

// GET /api/ccr/members/[id] - Busca um membro específico
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

    const member = await prismadb.member.findUnique({
      where: {
        id,
      },
    });

    if (!member) {
      return new NextResponse('Membro não encontrado', { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.log('[MEMBER_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/ccr/members/[id] - Atualiza um membro
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
    const { name, role, cpf, registration, agency, phone, email, gender, isActive } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    // Verificar se o membro existe
    const existingMember = await prismadb.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return new NextResponse('Membro não encontrado', { status: 404 });
    }

    const member = await prismadb.member.update({
      where: {
        id,
      },
      data: {
        name,
        role: role || null,
        cpf: cpf || null,
        registration: registration || null,
        agency: agency || null,
        phone: phone || null,
        email: email || null,
        gender: gender || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.log('[MEMBER_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/ccr/members/[id] - Remove um membro
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

    // Verificar se o membro existe
    const existingMember = await prismadb.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return new NextResponse('Membro não encontrado', { status: 404 });
    }

    // Deletar permanentemente
    await prismadb.member.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.log('[MEMBER_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
