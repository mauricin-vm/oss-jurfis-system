import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Verificar se a sessão existe
    const sessionData = await prismadb.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return new NextResponse('Sessão não encontrada', { status: 404 });
    }

    // Buscar recursos já incluídos na sessão
    const resourcesInSession = await prismadb.sessionResource.findMany({
      where: { sessionId },
      select: { resourceId: true },
    });

    const excludedResourceIds = resourcesInSession.map((sr) => sr.resourceId);

    console.log('[SESSION_AVAILABLE_RESOURCES] Search term:', search);
    console.log('[SESSION_AVAILABLE_RESOURCES] Excluded IDs:', excludedResourceIds);

    // Buscar recursos disponíveis para julgamento
    const resources = await prismadb.resource.findMany({
      where: {
        AND: [
          {
            // Recursos que ainda não estão na sessão
            id: {
              notIn: excludedResourceIds,
            },
          },
          // TODO: Descomentar filtro de status depois de testar
          // {
          //   // Recursos com status adequado para julgamento
          //   status: {
          //     in: ['DISTRIBUICAO', 'JULGAMENTO', 'NOTIFICACAO_JULGAMENTO'],
          //   },
          // },
          // Filtro de busca (se fornecido)
          search
            ? {
                OR: [
                  // Buscar por número do recurso (XXXX/YYYY)
                  {
                    resourceNumber: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  // Buscar por número do processo
                  {
                    processNumber: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  // Buscar por número do protocolo original (XXX/MM-YYYY)
                  {
                    protocol: {
                      number: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                  // Buscar por nome do processo
                  {
                    processName: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : {},
        ],
      },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            processNumber: true,
            presenter: true,
            createdAt: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                parentId: true,
              },
            },
          },
        },
        sessions: {
          include: {
            session: {
              select: {
                id: true,
                sessionNumber: true,
                date: true,
                type: true,
                status: true,
              },
            },
            attendances: {
              include: {
                part: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            viewRequestedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        distributions: {
          where: {
            isActive: true,
          },
          include: {
            firstDistribution: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Pegar apenas a última distribuição
        },
        authorities: {
          select: {
            id: true,
            type: true,
            authorityRegistered: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { sequenceNumber: 'desc' },
      ],
      take: 10, // Limitar a 10 resultados
    });

    console.log('[SESSION_AVAILABLE_RESOURCES] Resources found:', resources.length);
    if (resources.length > 0) {
      console.log('[SESSION_AVAILABLE_RESOURCES] First resource:', {
        id: resources[0].id,
        resourceNumber: resources[0].resourceNumber,
        processNumber: resources[0].processNumber,
        status: resources[0].status,
      });
    }

    // Buscar as partes de cada recurso e expandir distribuições
    const resourcesWithParts = await Promise.all(
      resources.map(async (resource) => {
        const parts = await prismadb.part.findMany({
          where: {
            processNumber: resource.processNumber,
          },
          select: {
            id: true,
            name: true,
            role: true,
            registrationType: true,
            registrationNumber: true,
          },
        });

        // Expandir informações de distribuição
        let distributionInfo = null;
        if (resource.distributions && resource.distributions.length > 0) {
          const lastDist = resource.distributions[0];

          // Buscar a primeira distribuição do relator (primeira vez que ele foi distributedTo)
          const firstDistribution = await prismadb.sessionDistribution.findFirst({
            where: {
              resourceId: resource.id,
              distributedToId: lastDist.firstDistribution?.id,
              isActive: true,
            },
            include: {
              session: {
                select: {
                  date: true,
                },
              },
            },
            orderBy: {
              session: {
                date: 'asc',
              },
            },
          });

          // Buscar membros revisores com datas de distribuição
          let revisoresList: Array<{
            id: string;
            name: string;
            role: string;
            distributionDate: Date | null;
          }> = [];

          if (lastDist.reviewersIds.length > 0) {
            const membersData = await prismadb.member.findMany({
              where: { id: { in: lastDist.reviewersIds } },
              select: { id: true, name: true, role: true },
            });

            // Para cada revisor, buscar se ele tem uma distribuição
            revisoresList = await Promise.all(
              membersData.map(async (member) => {
                // Buscar distribuição onde este membro foi o distributedTo
                const memberDistribution = await prismadb.sessionDistribution.findFirst({
                  where: {
                    resourceId: resource.id,
                    distributedToId: member.id,
                    isActive: true,
                  },
                  include: {
                    session: {
                      select: {
                        date: true,
                      },
                    },
                  },
                  orderBy: {
                    session: {
                      date: 'asc',
                    },
                  },
                });

                return {
                  id: member.id,
                  name: member.name,
                  role: member.role,
                  distributionDate: memberDistribution?.session.date || null,
                };
              })
            );
          }

          distributionInfo = {
            relator: lastDist.firstDistribution,
            relatorSessionDate: firstDistribution?.session.date || null,
            revisores: revisoresList,
          };
        }

        // Buscar todos os resultados do recurso para enriquecer as sessões
        const allResults = await prismadb.sessionResult.findMany({
          where: {
            resourceId: resource.id,
          },
          include: {
            preliminaryDecision: {
              select: {
                id: true,
                identifier: true,
                type: true,
              },
            },
            winningMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            votes: {
              include: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Enriquecer cada sessão com distribuições e resultados
        const sessionsWithFullData = await Promise.all(
          resource.sessions.map(async (sessionResource) => {
            const distribution = await prismadb.sessionDistribution.findFirst({
              where: {
                resourceId: resource.id,
                sessionId: sessionResource.sessionId,
              },
            });

            let firstDistribution = null;
            let distributedTo = null;
            let reviewers = [];

            if (distribution) {
              // Buscar o primeiro distribuído (relator)
              if (distribution.firstDistributionId) {
                firstDistribution = await prismadb.member.findUnique({
                  where: { id: distribution.firstDistributionId },
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                });
              }

              // Buscar quem recebeu a distribuição nesta sessão
              distributedTo = await prismadb.member.findUnique({
                where: { id: distribution.distributedToId },
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              });

              // Buscar os revisores usando os IDs
              if (distribution.reviewersIds && distribution.reviewersIds.length > 0) {
                reviewers = await prismadb.member.findMany({
                  where: {
                    id: { in: distribution.reviewersIds },
                  },
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                });
              }
            }

            // Filtrar resultados julgados nesta sessão específica
            const sessionResults = allResults.filter(
              (result) => result.judgedInSessionId === sessionResource.sessionId
            );

            return {
              ...sessionResource,
              distribution: distribution ? {
                firstDistribution,
                distributedTo,
                reviewers,
              } : null,
              results: sessionResults,
            };
          })
        );

        return {
          ...resource,
          parts,
          distributionInfo,
          sessions: sessionsWithFullData,
        };
      })
    );

    return NextResponse.json(resourcesWithParts);
  } catch (error) {
    console.log('[SESSION_AVAILABLE_RESOURCES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
