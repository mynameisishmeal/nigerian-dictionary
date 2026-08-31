import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in to vote' }, { status: 401 });
    }

    const userId = sessionData.user.id;
    const { definitionId, voteType } = await request.json(); // voteType: 1 (up) or -1 (down)

    if (voteType !== 1 && voteType !== -1) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    if (!definitionId) {
      return NextResponse.json({ error: 'Definition ID is required' }, { status: 400 });
    }

    // Ensure user exists in Prisma database
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          name: sessionData.user.name || 'Anonymous',
          email: sessionData.user.email,
          emailVerified: sessionData.user.emailVerified,
          image: sessionData.user.image,
        },
      });
    } else if (existingUser.role === 'banned') {
      return NextResponse.json({ error: 'Your account has been banned from voting on contributions.' }, { status: 403 });
    }

    // Transaction to ensure atomic vote and score updates
    const result = await prisma.$transaction(async (tx: any) => {
      const targetDefinition = await tx.definition.findUnique({
        where: { id: definitionId },
      });

      if (!targetDefinition) {
        throw new Error('Definition not found');
      }

      const existingVote = await tx.vote.findUnique({
        where: {
          userId_definitionId: { userId, definitionId },
        },
      });

      if (existingVote) {
        // If clicking the same vote again, remove/cancel the vote (toggle off)
        if (existingVote.voteType === voteType) {
          await tx.vote.delete({
            where: { userId_definitionId: { userId, definitionId } },
          });

          const updatedDef = await tx.definition.update({
            where: { id: definitionId },
            data: {
              netScore: { increment: -voteType },
            },
          });

          // Adjust author reputation
          await tx.user.update({
            where: { id: targetDefinition.authorId },
            data: {
              reputationScore: { increment: -voteType },
            },
          });

          return { definition: updatedDef, userVote: 0 };
        }

        // Changing vote from +1 to -1 or vice versa
        await tx.vote.update({
          where: { userId_definitionId: { userId, definitionId } },
          data: { voteType },
        });

        const scoreDiff = voteType === 1 ? 2 : -2;

        const updatedDef = await tx.definition.update({
          where: { id: definitionId },
          data: {
            netScore: { increment: scoreDiff },
          },
        });

        // Adjust author reputation
        await tx.user.update({
          where: { id: targetDefinition.authorId },
          data: {
            reputationScore: { increment: scoreDiff },
          },
        });

        return { definition: updatedDef, userVote: voteType };
      } else {
        // New vote
        await tx.vote.create({
          data: { userId, definitionId, voteType },
        });

        const updatedDef = await tx.definition.update({
          where: { id: definitionId },
          data: {
            netScore: { increment: voteType },
          },
        });

        // Adjust author reputation
        await tx.user.update({
          where: { id: targetDefinition.authorId },
          data: {
            reputationScore: { increment: voteType },
          },
        });

        return { definition: updatedDef, userVote: voteType };
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Vote API error:', error);
    if (error.message === 'Definition not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Voting failed' }, { status: 500 });
  }
}

