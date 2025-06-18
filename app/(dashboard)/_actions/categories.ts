"use server";

import { prisma } from "@/lib/prisma";
import {
  CreateCategorySchema,
  CreateCategorySchemaType,
  DeleteCategorySchema,
  DeleteCategorySchemaType,
} from "@/schema/categories";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function CreateCategory(form: CreateCategorySchemaType) {
  const parsedBody = CreateCategorySchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error("bad request");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { name, type, icon } = parsedBody.data;
  return await prisma.category.create({
    data: {
      id: crypto.randomUUID(), // ✅ Generate a unique ID
      name,
      type,
      icon,
      userId: user.id,
    },
  });
}

export async function DeleteCategory(form: DeleteCategorySchemaType) {
  const parsedBody = DeleteCategorySchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error("bad request");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const categories = await prisma.category.delete({
    where: {
      name_userId_type: {
        name: parsedBody.data.name,
        userId: user.id,
        type: parsedBody.data.type,
      },
    },
  });
}
