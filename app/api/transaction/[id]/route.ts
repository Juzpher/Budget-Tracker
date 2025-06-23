import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTransactionSchema } from "@/schema/transaction";
import { DateToUTCDate } from "@/lib/helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedFields = CreateTransactionSchema.safeParse(body);

    if (!validatedFields.success) {
      return new NextResponse("Invalid fields", { status: 400 });
    }

    const { type, description, amount, category, date } = validatedFields.data;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingTransaction) {
      return new NextResponse("Transaction not found", { status: 404 });
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: id,
        userId: user.id,
      },
      data: {
        type,
        description,
        amount,
        category,
        date: DateToUTCDate(date),
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
