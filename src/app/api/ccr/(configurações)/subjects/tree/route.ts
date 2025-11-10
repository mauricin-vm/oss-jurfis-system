import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// GET /api/ccr/subjects/tree - Retorna árvore hierárquica de assuntos
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Buscar todos os assuntos ativos
    const allSubjects = await prismadb.subject.findMany({
      where: {
        isActive: true,
      },
      include: {
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

    // Construir árvore hierárquica
    const buildTree = (parentId: string | null = null): any[] => {
      return allSubjects
        .filter((subject) => subject.parentId === parentId)
        .map((subject) => ({
          ...subject,
          children: buildTree(subject.id),
        }));
    };

    const tree = buildTree();

    return NextResponse.json(tree);
  } catch (error) {
    console.log('[SUBJECTS_TREE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
