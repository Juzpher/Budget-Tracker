import { CurrencyComboBox } from "@/components/ComboBox/CurrencyComboBox";
import Logo from "@/components/Logo/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import React from "react";

//Async Function should be Capitalized
async function Page() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return (
    <div className="container px-4 max-w-2xl flex flex-col items-center justify-between gap-4">
      <div>
        <h1 className="text-center text-3xl">
          Welcome <span className="ml-2 font-bold">{user.fullName} 👋</span>
        </h1>
        <h2 className="mt-4 text-center text-base text-muted-foreground">
          Let &apos; s get started by setting up your currency
        </h2>
        <h3 className="mt-2 text-center text-sm text-muted-foreground">
          You can change this settings at anytime
        </h3>
      </div>
      <Separator />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            Set your default currency for transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyComboBox />
        </CardContent>
      </Card>
      <Separator />
      <Button className="w-full cursor-pointer" asChild>
        <Link href={"/"}>Continue to Dashboard</Link>
      </Button>
      <div className="mt-8">
        <Logo />
      </div>
    </div>
  );
}

export default Page;
