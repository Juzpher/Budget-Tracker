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
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>(
    () => {
      // Check if there's a saved date range in sessionStorage
      if (typeof window !== "undefined") {
        const savedRange = sessionStorage.getItem("overviewDateRange");
        if (savedRange) {
          try {
            const parsed = JSON.parse(savedRange);
            return {
              from: new Date(parsed.from),
              to: new Date(parsed.to),
            };
          } catch (error) {
            console.error("Error parsing saved date range:", error);
          }
        }
      }
      // Default to current month if no saved range
      return {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
  );

  const saveDateRange = React.useCallback((from: Date, to: Date) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "overviewDateRange",
        JSON.stringify({
          from: from.toISOString(),
          to: to.toISOString(),
        })
      );
    }
  }, []);

  const handleDateRangeUpdate = React.useCallback(
    (values: { range: { from: Date; to: Date | undefined } }) => {
      const { to, from } = values.range;
      if (!to || !from) return;

      if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
        toast.error(
          `Date range is too long. Maximum allowed is ${MAX_DATE_RANGE_DAYS} days!`
        );
        return;
      }

      setDateRange({ from, to });
      saveDateRange(from, to);
    },
    [saveDateRange]
  );

  return (
    <>
      {/* Header section */}
      <div className="container mx-auto px-4 md:px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-3xl font-bold px-4">Overview</h2>
          <div className="flex items-center gap-3">
            <DateRangePicker
              initialDateFrom={dateRange.from}
              initialDateTo={dateRange.to}
              showCompare={false}
              onUpdate={handleDateRangeUpdate}
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
