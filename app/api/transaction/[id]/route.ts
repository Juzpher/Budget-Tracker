import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTransactionSchema } from "@/schema/transaction";
import { DateToUTCDate } from "@/lib/helpers";
import crypto from "crypto";

// Helper functions to rebuild aggregate data
async function rebuildMonthHistory(userId: string, date: Date) {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  // Get all transactions for this specific day
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: new Date(year, month, day),
        lt: new Date(year, month, day + 1),
      },
    },
  });

  // Calculate totals
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "expense") acc.expense += t.amount;
      if (t.type === "income") acc.income += t.amount;
      return acc;
    },
    { expense: 0, income: 0 }
  );

  // Upsert the aggregate record
  await prisma.monthHistory.upsert({
    where: {
      day_month_year_userId: { userId, day, month, year },
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      day,
      month,
      year,
      expense: totals.expense,
      income: totals.income,
    },
    update: {
      expense: totals.expense,
      income: totals.income,
    },
  });
}

async function rebuildYearHistory(userId: string, date: Date) {
  const month = date.getMonth();
  const year = date.getFullYear();

  // Get all transactions for this specific month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: new Date(year, month, 1),
        lt: new Date(year, month + 1, 1),
      },
    },
  });

  // Calculate totals
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "expense") acc.expense += t.amount;
      if (t.type === "income") acc.income += t.amount;
      return acc;
    },
    { expense: 0, income: 0 }
  );

  // Upsert the aggregate record
  await prisma.yearHistory.upsert({
    where: {
      month_year_userId: { userId, month, year },
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      month,
      year,
      expense: totals.expense,
      income: totals.income,
    },
    update: {
      expense: totals.expense,
      income: totals.income,
    },
  });
}

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

    // Update the transaction only - skip complex aggregate updates to prevent negative values
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

    // Rebuild aggregate data for affected periods to ensure accuracy
    const affectedDates = [existingTransaction.date, DateToUTCDate(date)];

    for (const affectedDate of affectedDates) {
      // Rebuild month history for this date
      await rebuildMonthHistory(user.id, affectedDate);

      // Rebuild year history for this date
      await rebuildYearHistory(user.id, affectedDate);
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
