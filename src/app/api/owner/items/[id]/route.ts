import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Verify the item exists and belongs to the owner's restaurant
    const item = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (session.role === 'OWNER' && item.restaurantId !== session.restaurantId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this item' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.isAvailable === 'boolean') updateData.isAvailable = body.isAvailable;
    if (typeof body.price === 'number') {
      const roundedPrice = Math.max(0, Math.round(body.price));
      updateData.price = roundedPrice;

      // Automatically sync promotion modal button price if this item is currently spotlighted!
      await prisma.promotion.updateMany({
        where: {
          restaurantId: item.restaurantId,
          type: 'SPECIAL_DISH',
          primaryBtnAction: `ADD_ITEM:${item.code}`,
        },
        data: {
          primaryBtnText: `Add Special to Order (+₹${roundedPrice})`,
        },
      });
    }
    if (typeof body.code === 'string' && body.code.trim()) {
      const newCode = body.code.trim();

      if (item.code !== newCode) {
        // Enforce uniqueness constraint per restaurant
        const duplicate = await prisma.menuItem.findFirst({
          where: {
            restaurantId: item.restaurantId,
            code: newCode,
            id: { not: item.id },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: `POS Code #${newCode} is already assigned to "${duplicate.nameEn}". Each dish must have a unique POS Code.` },
            { status: 400 }
          );
        }

        updateData.code = newCode;

        // Sync promotion action if this item was spotlighted
        await prisma.promotion.updateMany({
          where: {
            restaurantId: item.restaurantId,
            type: 'SPECIAL_DISH',
            primaryBtnAction: `ADD_ITEM:${item.code}`,
          },
          data: {
            primaryBtnAction: `ADD_ITEM:${newCode}`,
          },
        });
      }
    }
    if (typeof body.nameEn === 'string') updateData.nameEn = body.nameEn.trim();
    if (typeof body.nameKn === 'string') updateData.nameKn = body.nameKn.trim();
    if (typeof body.badge === 'string') updateData.badge = body.badge.trim() || null;
    if (typeof body.description === 'string') updateData.description = body.description.trim() || null;
    if (typeof body.categoryId === 'string' && body.categoryId) updateData.categoryId = body.categoryId;
    if (typeof body.isSpecial === 'boolean') updateData.isSpecial = body.isSpecial;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (session.role === 'OWNER' && item.restaurantId !== session.restaurantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
