import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

/**
 * PATCH /api/ccr/sessions/[id]/processos/[resourceId]/status
 * Atualiza o status do processo e informações relacionadas
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: sessionId, resourceId } = await params;
    const body = await req.json();
    const {
      status,
      viewRequestedMemberId,
      diligenceDaysDeadline,
      minutesText,
    } = body;

    // Validar status
    const validStatuses = ['EM_PAUTA', 'SUSPENSO', 'DILIGENCIA', 'PEDIDO_VISTA', 'JULGADO'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Buscar SessionResource
    const sessionResource = await prismadb.sessionResource.findUnique({
      where: { id: resourceId },
      include: {
        resource: true,
        judgment: true,
      },
    });

    if (!sessionResource) {
      return NextResponse.json(
        { error: 'Processo não encontrado na sessão' },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {
      status,
      minutesText: minutesText || null,
    };

    // Campos específicos por status
    if (status === 'PEDIDO_VISTA') {
      if (viewRequestedMemberId) {
        updateData.viewRequestedById = viewRequestedMemberId;
      }
    } else {
      updateData.viewRequestedById = null;
    }

    if (status === 'DILIGENCIA') {
      if (diligenceDaysDeadline) {
        updateData.diligenceDaysDeadline = parseInt(diligenceDaysDeadline);
      }
    } else {
      updateData.diligenceDaysDeadline = null;
    }

    // Se marcar como JULGADO, criar SessionJudgment se não existir
    if (status === 'JULGADO' && !sessionResource.judgment) {
      // Buscar votações para determinar a vencedora
      const votingResults = await prismadb.sessionVotingResult.findMany({
        where: {
          sessionResourceId: resourceId,
        },
        include: {
          memberVotes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (votingResults.length === 0) {
        return NextResponse.json(
          { error: 'Não é possível finalizar julgamento sem votações registradas' },
          { status: 400 }
        );
      }

      // Por simplicidade, usar a última votação de mérito como vencedora
      const meritVoting = votingResults.find(v => v.type === 'MERITO');

      if (!meritVoting) {
        return NextResponse.json(
          { error: 'Não é possível finalizar julgamento sem votação de mérito' },
          { status: 400 }
        );
      }

      // Criar SessionJudgment
      await prismadb.sessionJudgment.create({
        data: {
          sessionResourceId: resourceId,
          winningVotingResultId: meritVoting.id,
          observations: minutesText || null,
        },
      });

      // Atualizar status do Resource para PUBLICACAO_ACORDAO
      await prismadb.resource.update({
        where: { id: sessionResource.resource.id },
        data: { status: 'PUBLICACAO_ACORDAO' },
      });
    }

    // Atualizar SessionResource
    const updated = await prismadb.sessionResource.update({
      where: { id: resourceId },
      data: updateData,
      include: {
        viewRequestedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resource: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}
