"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { UserSettings } from "@/lib/generated/prisma";
import { differenceInDays, endOfMonth, startOfMonth } from "date-fns";
import React from "react";
import { toast } from "sonner";
import StatsCards from "./StatsCards";
import CategoriesStats from "./CategoriesStats";

const Overview = ({ userSettings }: { userSettings: UserSettings }) => {
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  return (
    <>
      {/* Header section */}
      <div className="container mx-auto px-4 md:px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-3xl font-bold">Overview</h2>
          <div className="flex items-center gap-3">
            <DateRangePicker
              initialDateFrom={dateRange.from}
              initialDateTo={dateRange.to}
              showCompare={false}
              onUpdate={(values) => {
                const { to, from } = values.range;
                if (!to || !from) return;
                if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                  toast.error(
                    `Date range is too long. Maximum allowed is ${MAX_DATE_RANGE_DAYS} days!`
                  );
                  return;
                }
                setDateRange({ from, to });
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="container mx-auto px-4 flex w-full flex-col gap-2">
        <StatsCards
          userSettings={userSettings}
          from={dateRange.from}
          to={dateRange.to}
        />
        <CategoriesStats
          userSettings={userSettings}
          from={dateRange.from}
          to={dateRange.to}
        />
      </div>
    </>
  );
};

export default Overview;
