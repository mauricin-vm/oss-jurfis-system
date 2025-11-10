import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { canAccessSubjects, canCreateSubject } from '@/lib/permissions';

// GET /api/ccr/subjects - Lista todos os assuntos
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canAccessSubjects(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');
    const parentId = searchParams.get('parentId');

    const subjects = await prismadb.subject.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(parentId === 'null'
          ? { parentId: null } // Root subjects
          : parentId
          ? { parentId } // Children of specific parent
          : {}), // All subjects
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            resourceLinks: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.log('[SUBJECTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/ccr/subjects - Cria um novo assunto
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!canCreateSubject(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { name, description, parentId } = body;

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    // Se tem parentId, verificar se o pai existe
    if (parentId) {
      const parentExists = await prismadb.subject.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        return new NextResponse('Assunto pai não encontrado', { status: 400 });
      }
    }

    const subject = await prismadb.subject.create({
      data: {
        name,
        description: description || null,
        parentId: parentId || null,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.log('[SUBJECTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
