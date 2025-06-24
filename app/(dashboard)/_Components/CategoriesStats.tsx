"use client";

import { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import { TransactionType } from "@/app/types/transaction";
import SkeletonWrapper from "@/components/Skeleton/SkeletonWrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserSettings } from "@/lib/generated/prisma";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import CountUp from "react-countup";
import { TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  from: Date;
  to: Date;
  userSettings: UserSettings;
}

function CategoriesStats({ from, to, userSettings }: Props) {
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview", "stats", "categories", from, to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`
      ).then((res) => res.json()),
  });

  const formatter = React.useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          type="income"
          data={statsQuery.data || []}
        />
      </SkeletonWrapper>
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          type="expense"
          data={statsQuery.data || []}
        />
      </SkeletonWrapper>
    </div>
  );
}

export default CategoriesStats;

function CategoriesCard({
  data,
  type,
  formatter,
}: {
  type: TransactionType;
  formatter: Intl.NumberFormat;
  data: GetCategoriesStatsResponseType;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredData = data.filter((el) => el.type === type);
  const total = filteredData.reduce(
    (acc, el) => acc + (el._sum?.amount || 0),
    0
  );

  const isIncome = type === "income";

  return (
    <Card className="shadow-sm border bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {isIncome ? "Income" : "Expenses"}
              </span>
              <span className="text-sm text-muted-foreground">by Category</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {filteredData.length} categories
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {filteredData.length === 0 && (
          <div className="flex h-60 w-full flex-col items-center justify-center p-8">
            <div className="rounded-full bg-muted p-4 mb-4">
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-muted-foreground">
                No data for the selected period
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try selecting a different period or adding new{" "}
                {isIncome ? "income" : "expense"} transactions
              </p>
            </div>
          </div>
        )}

        {filteredData.length > 0 && (
          <ScrollArea className="h-80">
            <div className="space-y-1 p-6 pt-2">
              {filteredData.map((item, index) => {
                const amount = item._sum?.amount || 0;
                const percentage = (amount * 100) / (total || amount);

                return (
                  <div
                    key={item.category}
                    className={cn(
                      "group rounded-lg p-2 transition-colors hover:bg-muted/25",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                          <span
                            className="text-sm"
                            role="img"
                            aria-label="category"
                          >
                            {item.categoryIcon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground capitalize text-sm">
                            {item.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}% of total
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {mounted ? (
                          <CountUp
                            preserveValue
                            redraw={false}
                            end={amount}
                            decimals={2}
                            formattingFn={(value: number) =>
                              formatter.format(value)
                            }
                            delay={0}
                            duration={1}
                          >
                            {({ countUpRef }) => (
                              <span
                                className={cn(
                                  "font-semibold text-sm",
                                  isIncome ? "text-[#10b981]" : "text-[#ef4444]"
                                )}
                                ref={countUpRef}
                              />
                            )}
                          </CountUp>
                        ) : (
                          <span
                            className={cn(
                              "font-semibold text-sm",
                              isIncome ? "bg-[#10b981]" : "bg-[#ef4444]"
                            )}
                          >
                            {formatter.format(amount)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Progress
                      value={percentage}
                      className="h-2"
                      indicator={cn(
                        "transition-all duration-300",
                        isIncome ? "bg-[#10b981]" : "bg-[#ef4444]"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
