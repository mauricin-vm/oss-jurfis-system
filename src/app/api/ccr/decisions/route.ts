import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// TODO: O modelo Decision não existe no schema do Prisma
// As decisões (acórdãos) devem ser implementadas usando:
// - SessionJudgment para o julgamento final
// - Resource.decisionNumber/decisionYear para o número do acórdão
// - SessionVotingResult para os resultados das votações

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json({
      error: 'Not Implemented',
      message: 'O modelo Decision não está implementado no schema do Prisma. Use SessionJudgment ou Resource para acórdãos.'
    }, { status: 501 });
  } catch (error) {
    console.log('[DECISIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json({
      error: 'Not Implemented',
      message: 'O modelo Decision não está implementado no schema do Prisma. Use SessionJudgment ou Resource para acórdãos.'
    }, { status: 501 });
  } catch (error) {
    console.log('[DECISIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
