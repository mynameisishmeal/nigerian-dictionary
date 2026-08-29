import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/admin-auth';

export async function PATCH(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { id, meaning, example, netScore } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Definition ID is required' }, { status: 400 });
    }

    const updatedDef = await prisma.definition.update({
      where: { id },
      data: {
        meaning: meaning?.trim() || undefined,
        example: example !== undefined ? (example?.trim() || null) : undefined,
        netScore: typeof netScore === 'number' ? netScore : undefined,
      },
      include: {
        word: true,
        author: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, definition: updatedDef });
  } catch (error: any) {
    console.error('Admin definition PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update definition' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Definition ID is required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.vote.deleteMany({
        where: { definitionId: id },
      });
      await tx.definition.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Definition deleted successfully' });
  } catch (error: any) {
    console.error('Admin definition DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete definition' }, { status: 500 });
  }
}
