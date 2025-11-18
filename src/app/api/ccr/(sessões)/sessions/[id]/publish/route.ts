import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

/**
 * POST /api/ccr/sessions/[id]/publish
 * Publica a pauta da sessão
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário existe no banco de dados
    const user = await prismadb.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const { publicationNumber, publicationDate } = await req.json();

    if (!publicationNumber || !publicationDate) {
      return NextResponse.json(
        { error: 'Número e data da publicação são obrigatórios' },
        { status: 400 }
      );
    }

    // Await params
    const { id } = await params;

    // Buscar sessão com recursos e distribuições
    const sessionData = await prismadb.session.findUnique({
      where: { id },
      include: {
        resources: {
          include: {
            resource: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        distributions: {
          where: {
            isActive: true
          },
          include: {
            firstDistribution: true
          }
        },
        members: {
          include: {
            member: true
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
    const existingPublication = await prismadb.publication.findFirst({
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

    // Criar publicação da pauta e snapshot em uma transação
    const publication = await prismadb.$transaction(async (tx) => {
      // Criar a publicação
      const pub = await tx.publication.create({
        data: {
          type: 'SESSAO',
          publicationNumber,
          publicationDate: new Date(publicationDate),
          sessionId: id,
          createdBy: session.user.id,
        }
      });

      // Criar snapshot de cada processo na pauta
      for (const sessionResource of sessionData.resources) {
        // Buscar distribuição deste recurso
        const distribution = sessionData.distributions.find(
          d => d.resourceId === sessionResource.resourceId
        );

        // Buscar nomes dos revisores
        const reviewersNames = distribution?.reviewersIds.map(reviewerId => {
          const member = sessionData.members.find(m => m.member.id === reviewerId);
          return member?.member.name || '';
        }).filter(Boolean) || [];

        // Buscar nome do distribuído
        const distributedToMember = sessionData.members.find(
          m => m.member.id === distribution?.distributedToId
        );

        await tx.publicationSessionSnapshot.create({
          data: {
            publicationId: pub.id,
            resourceId: sessionResource.resourceId,
            processNumber: sessionResource.resource.processNumber,
            processName: sessionResource.resource.processName,
            order: sessionResource.order,
            status: sessionResource.status,
            firstDistributionId: distribution?.firstDistributionId || null,
            firstDistributionName: distribution?.firstDistribution?.name || null,
            reviewersIds: distribution?.reviewersIds || [],
            reviewersNames: reviewersNames,
            distributedToId: distribution?.distributedToId || '',
            distributedToName: distributedToMember?.member.name || '',
          }
        });
      }

      // Resetar flag addedAfterLastPublication para todos os recursos da sessão
      await tx.sessionResource.updateMany({
        where: {
          sessionId: id
        },
        data: {
          addedAfterLastPublication: false
        }
      });

      // Atualizar status da sessão para PENDENTE
      await tx.session.update({
        where: { id },
        data: {
          status: 'PENDENTE'
        }
      });

      return pub;
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
