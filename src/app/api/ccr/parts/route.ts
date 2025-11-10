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
    const role = searchParams.get('role');

    const parts = await prismadb.part.findMany({
      where: {
        ...(role && { role: role as any }),
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.log('[PARTS_GET]', error);
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

    const part = await prismadb.part.create({
      data: {
        name,
        role,
        document: document || null,
        createdBy: session.user.id,
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
    console.log('[PARTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
