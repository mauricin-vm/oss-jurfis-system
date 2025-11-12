import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessMembers, canCreateMember } from '@/lib/permissions';

// GET /api/ccr/authorities-registered - Lista todas as autoridades
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

    const authorities = await prismadb.authorityRegistered.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      include: {
        _count: {
          select: {
            authorities: true, // Vinculações com recursos
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Adicionar flag isInUse para indicar se a autoridade está sendo usada
    const authoritiesWithFlag = authorities.map(authority => ({
      ...authority,
      isInUse: authority._count.authorities > 0,
    }));

    return NextResponse.json(authoritiesWithFlag);
  } catch (error) {
    console.log('[AUTHORITIES_REGISTERED_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/ccr/authorities-registered - Cria uma nova autoridade
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
    const { name, phone, email } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    const authority = await prismadb.authorityRegistered.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        isActive: true,
      },
    });

    return NextResponse.json(authority);
  } catch (error) {
    console.log('[AUTHORITIES_REGISTERED_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
