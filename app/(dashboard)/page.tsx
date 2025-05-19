import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import CreateTransactionDialog from "./_Components/CreateTransactionDialog";

async function page() {
  //validating user
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  //validating user settings
  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!userSettings) {
    redirect("/wizard");
  }
  return (
    <div className="h-full bg-background">
      <div className="border-b bg-card">
        <div className="w-full flex flex-wrap items-center justify-between gap-6 py-8 px-8">
          <p className="text-3xl font-bold">Hello {user.firstName}! 👋</p>

          <div className="flex items-center gap-3">
            <CreateTransactionDialog
              trigger={<Button variant="success">New Income</Button>}
              types="income"
            />

            <CreateTransactionDialog
              trigger={<Button variant="error">New Expense</Button>}
              types="expense"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default page;
