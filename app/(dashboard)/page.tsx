import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import CreateTransactionDialog from "./_Components/CreateTransactionDialog";
import Overview from "./_Components/Overview";
import History from "./_Components/History";

async function page() {
  // Validate user
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Validate user settings
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
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col flex-nowrap md:flex-row md:flex-wrap items-center justify-between gap-6">
          <p className="text-3xl font-bold">
            Hello {user.firstName}!<span className="hidden md:inline">👋</span>
          </p>

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

      {/* Overview and History */}
      <Overview userSettings={userSettings} />
      <History userSettings={userSettings} />
    </div>
  );
}

export default page;
