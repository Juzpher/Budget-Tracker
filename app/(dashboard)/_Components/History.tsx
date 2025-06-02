"use client";

import { Period, TimeFrame } from "@/app/types/transaction";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSettings } from "@/lib/generated/prisma/client";
import { GetFormatterForCurrency } from "@/lib/helpers";
import React from "react";

function History({ userSettings }: { userSettings: UserSettings }) {
  const [timeframe, setTimeframe] = React.useState<TimeFrame>("month");
  const [period, setPeriod] = React.useState<Period>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  const formatter = React.useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);
  return (
    <div className=" px-8 w-full">
      <h2 className="mt-12 text-3xl font-bold">History</h2>
      <Card className="col-span-12 mt-2 w-full">
        <CardHeader className="gap-2">
          <CardTitle className="grid grid-flow-row justify-between gap-2 md:grid-flow-col"></CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default History;
