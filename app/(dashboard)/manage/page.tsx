"use client";
import { TransactionType } from "@/app/types/transaction";
import { CurrencyComboBox } from "@/components/ComboBox/CurrencyComboBox";
import SkeletonWrapper from "@/components/Skeleton/SkeletonWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category } from "@/lib/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import {
  PlusSquare,
  Trash,
  TrashIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { CreateCategory } from "../_actions/categories";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import DeleteCategoryDialog from "../_components/DeleteCategoryDialog";
import CreateCategoryDialog from "../_Components/CreateCategoryDialog";

function page() {
  return (
    <>
      {/* HEADER */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col flex-nowrap md:flex-row md:flex-wrap items-center justify-between gap-6">
          <div className="px-4">
            <p className="text-3xl font-bold">Manage</p>
            <p className="text-muted-foreground">
              Manage your account settings and categories
            </p>
          </div>
        </div>
      </div>
      {/* END HEADER */}
      <div className="container flex flex-col gap-4 p-4 mx-auto">
        <Card>
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
        <CategoryList type="income" />
        <CategoryList type="expense" />
      </div>
    </>
  );
}

export default page;

function CategoryList({ type }: { type: TransactionType }) {
  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: () =>
      fetch(`/api/categories?type=${type}`).then((res) => res.json()),
  });

  const dataAvailable = categoriesQuery.data && categoriesQuery.data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {type === "expense" ? (
              <TrendingDown className="h-12 w-12 items-center rounded-lg  bg-rose-400/10 p-2 text-rose-500" />
            ) : (
              <TrendingUp className="h-12 w-12 items-center rounded-lg  bg-emerald-400/10 p-2 text-emerald-500" />
            )}
            <div className="">
              {type === "income" ? "Incomes" : "Expenses"} categories
              <div className="text-sm text-muted-foreground hidden sm:block">
                Sorted by name
              </div>
            </div>
          </div>

          <CreateCategoryDialog
            type={type}
            successCallback={() => categoriesQuery.refetch()}
            trigger={
              <Button className="gap-2 text-sm">
                <PlusSquare className="h-4 w-4" />
                <span className="hidden sm:block"> Create category</span>
              </Button>
            }
          />
        </CardTitle>
      </CardHeader>
      <Separator />
      {!dataAvailable && (
        <div className="flex h-40 w-full flex-col items-center justify-center">
          <p>
            No{" "}
            <span
              className={cn(
                "m-1",
                type === "income" && "text-emerald-500",
                type === "expense" && "text-rose-500"
              )}
            >
              {type === "income" ? "incomes" : "expenses"}
            </span>
            categories yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create one to get started
          </p>
        </div>
      )}
      {dataAvailable && (
        <div className="grid grid-flow-row gap-2 p-2 sm:grid-flow-row sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categoriesQuery.data.map((category: Category) => (
            <CategoryCard key={category.name} category={category} />
          ))}
        </div>
      )}
    </Card>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });
  return (
    <SkeletonWrapper isLoading={categoriesQuery.isLoading}>
      <div className="flex border-separate flex-col justify-between rounded-md border shadow-md shadow-black/[0.1] dark:shadow-white/[0.1]">
        <div className="flex flex-col items-center gap-2 p-4">
          <span className="text-3xl" role="img">
            {category.icon}
          </span>
          <span>{category.name}</span>
        </div>
        <DeleteCategoryDialog
          category={category}
          trigger={
            <Button
              className="flex w-full border-separate items-center gap-2 rounded-t-none text-muted-foreground hover:bg-rose-500/20"
              variant={"secondary"}
            >
              <TrashIcon className="h-4 w-4" />
              Remove
            </Button>
          }
        />
      </div>
    </SkeletonWrapper>
  );
}
