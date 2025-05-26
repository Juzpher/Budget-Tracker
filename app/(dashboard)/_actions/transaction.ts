"use server";

import { prisma } from "@/lib/prisma";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
} from "@/schema/transaction";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message);
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { amount, category, date, description, type } = parsedBody.data;
  const categoryRow = await prisma.category.findFirst({
    where: {
      userId: user.id,
      name: category,
    },
  });

  if (!categoryRow) {
    throw new Error("Category not found");
  }

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        amount,
        date,
        description: description || "",
        type,
        category: categoryRow.name,
        categoryIcon: categoryRow.icon,
      },
    }),
  ]);

  //Update Month aggreate Table

  await prisma.monthHistory.upsert({
    where: {
      day_month_year_userId: {
        day: date.getUTCDate(),
        month: date.getUTCMonth(), // month is 0-indexed
        year: date.getUTCFullYear(),
        userId: user.id,
      },
    },

    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      day: date.getUTCDate(),
      month: date.getUTCMonth(), // month is 0-indexed
      year: date.getUTCFullYear(),
      expense: type === "expense" ? amount : 0,
      income: type === "income" ? amount : 0,
    },

    update: {
      expense: {
        increment: type === "expense" ? amount : 0,
      },
      income: {
        increment: type === "income" ? amount : 0,
      },
    },
  });

  //Update Year aggreate Table

  await prisma.yearHistory.upsert({
    where: {
      month_year_userId: {
        month: date.getUTCMonth(), // month is 0-indexed
        year: date.getUTCFullYear(),
        userId: user.id,
      },
    },

    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      month: date.getUTCMonth(), // month is 0-indexed
      year: date.getUTCFullYear(),
      expense: type === "expense" ? amount : 0,
      income: type === "income" ? amount : 0,
    },

    update: {
      expense: {
        increment: type === "expense" ? amount : 0,
      },
      income: {
        increment: type === "income" ? amount : 0,
      },
    },
  });
}
