import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function PATCH(
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

    const { mainSubjectId, subitemIds } = body;

    // Validações
    if (!mainSubjectId) {
      return new NextResponse('Assunto principal é obrigatório', { status: 400 });
    }

    // Verificar se o recurso existe
    const resource = await prismadb.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return new NextResponse('Recurso não encontrado', { status: 404 });
    }

    // Verificar se o assunto principal existe
    const mainSubject = await prismadb.subject.findUnique({
      where: { id: mainSubjectId },
    });

    if (!mainSubject) {
      return new NextResponse('Assunto principal não encontrado', { status: 404 });
    }

    // Verificar se todos os subitens existem e são filhos do assunto principal
    if (subitemIds && subitemIds.length > 0) {
      const subitems = await prismadb.subject.findMany({
        where: {
          id: { in: subitemIds },
        },
      });

      const allValid = subitems.every((s) => s.parentId === mainSubjectId);
      if (!allValid) {
        return new NextResponse('Alguns subitens não pertencem ao assunto principal', {
          status: 400,
        });
      }
    }

    // Remover todas as relações existentes
    await prismadb.subjectChildren.deleteMany({
      where: { resourceId: id },
    });

    // Criar nova relação com o assunto principal
    await prismadb.subjectChildren.create({
      data: {
        resourceId: id,
        subjectId: mainSubjectId,
        isPrimary: true,
      },
    });

    // Criar relações com os subitens
    if (subitemIds && subitemIds.length > 0) {
      await prismadb.subjectChildren.createMany({
        data: subitemIds.map((subitemId: string) => ({
          resourceId: id,
          subjectId: subitemId,
          isPrimary: false,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('[RESOURCE_SUBJECTS_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
