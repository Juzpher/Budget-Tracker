"use client";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, endOfMonth, startOfMonth } from "date-fns";
import React from "react";
import { toast } from "sonner";
import TransactionTable from "./_components/TransactionTable";

function page() {
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  return (
    <>
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col flex-nowrap md:flex-row md:flex-wrap items-center justify-between gap-6">
          <div className="px-4">
            <p className="text-3xl font-bold">Transaction history</p>
          </div>
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
      <div className="container mx-auto px-4 py-8 flex flex-col flex-nowrap md:flex-row md:flex-wrap items-center justify-between gap-6">
        <TransactionTable from={dateRange.from} to={dateRange.to} />
      </div>
    </>
  );
}

export default page;
