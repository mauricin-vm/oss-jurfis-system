import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessMembers, canCreateMember } from '@/lib/permissions';

// GET /api/ccr/members - Lista todos os membros
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canAccessMembers(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    const members = await prismadb.member.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      include: {
        _count: {
          select: {
            tramitations: true,
            sessionsAsPresident: true,
            sessionsPresent: true,
            sessionResourcesAsPresident: true,
            distributions: true,
            votes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Adicionar flag isInUse para indicar se o membro está sendo usado
    const membersWithFlag = members.map(member => ({
      ...member,
      isInUse:
        member._count.tramitations > 0 ||
        member._count.sessionsAsPresident > 0 ||
        member._count.sessionsPresent > 0 ||
        member._count.sessionResourcesAsPresident > 0 ||
        member._count.distributions > 0 ||
        member._count.votes > 0,
    }));

    return NextResponse.json(membersWithFlag);
  } catch (error) {
    console.log('[MEMBERS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/ccr/members - Cria um novo membro
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canCreateMember(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { name, role, cpf, registration, agency, phone, email, gender } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    const member = await prismadb.member.create({
      data: {
        name,
        role: role || null,
        cpf: cpf || null,
        registration: registration || null,
        agency: agency || null,
        phone: phone || null,
        email: email || null,
        gender: gender || null,
        isActive: true,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.log('[MEMBERS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
