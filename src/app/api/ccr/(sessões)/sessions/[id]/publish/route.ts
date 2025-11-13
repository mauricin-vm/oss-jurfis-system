import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ccr/sessions/[id]/publish
 * Publica a pauta da sessão
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { publicationNumber, publicationDate, observations } = await req.json();

    if (!publicationNumber || !publicationDate) {
      return NextResponse.json(
        { error: 'Número e data da publicação são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar sessão
    const sessionData = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        resources: {
          include: {
            resource: true
          }
        }
      }
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a sessão está no status PUBLICACAO ou PENDENTE
    if (sessionData.status !== 'PUBLICACAO' && sessionData.status !== 'PENDENTE') {
      return NextResponse.json(
        { error: 'Sessão não pode ser publicada neste status' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma publicação com este número
    const existingPublication = await prisma.publication.findFirst({
      where: {
        publicationNumber,
        type: 'SESSAO'
      }
    });

    if (existingPublication) {
      return NextResponse.json(
        { error: 'Já existe uma publicação com este número' },
        { status: 400 }
      );
    }

    // Criar publicação da pauta
    const publication = await prisma.publication.create({
      data: {
        type: 'SESSAO',
        publicationNumber,
        publicationDate: new Date(publicationDate),
        sessionId: params.id,
        createdBy: session.user.id,
      }
    });

    // Atualizar status da sessão para PENDENTE
    await prisma.session.update({
      where: { id: params.id },
      data: {
        status: 'PENDENTE'
      }
    });

    return NextResponse.json({
      success: true,
      publication
    });
  } catch (error) {
    console.error('Erro ao publicar pauta:', error);
    return NextResponse.json(
      { error: 'Erro ao publicar pauta' },
      { status: 500 }
    );
  }
}
