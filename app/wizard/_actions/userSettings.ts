"use server";

import { prisma } from "@/lib/prisma";
import { UpdateCurrencySchema } from "@/schema/userSettings";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function UpdateUserCurrency(currency: string) {
  //validatinig user input
  const parsedBody = UpdateCurrencySchema.safeParse({ currency });
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message);
  }
  //validating user session
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  //Update
  const userSettings = await prisma.userSettings.update({
    where: {
      userId: user.id,
    },
    data: {
      currency,
    },
  });

  return userSettings;
}
