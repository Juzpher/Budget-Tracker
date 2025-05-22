import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { log } from "console";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  //This block of codes checks the query parameters if it is valid the only acceptable values are "income" and "expense" and it wil be validated by the zod validator.
  const { searchParams } = new URL(request.url);
  const paramType = searchParams.get("type");
  const validator = z.enum(["income", "expense"]).nullable();
  const queryParams = validator.safeParse(paramType);

  if (!queryParams.success) {
    return Response.json(queryParams.error, { status: 400 });
  }

  const type = queryParams.data;
  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
      ...(type && { type }), //include the type if it is not null
    },
    orderBy: {
      name: "asc",
    },
  });

  return Response.json(categories);
}
