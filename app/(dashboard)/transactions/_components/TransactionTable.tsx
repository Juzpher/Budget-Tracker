"use client";
import React from "react";
import { GetTransactionHistoryResponseType } from "@/app/api/transaction-history/route";
import { Transaction } from "@/lib/generated/prisma";
import { TransactionType } from "@/app/types/transaction";
import { DateToUTCDate } from "@/lib/helpers";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  ColumnFilter,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import SkeletonWrapper from "@/components/Skeleton/SkeletonWrapper";
import { DataTableColumnHeader } from "@/components/DataTable/ColumnHeader";
import { DataTableViewOptions } from "@/components/DataTable/ColumnToggle";
import { DataTableFacetedFilter } from "@/components/DataTable/FacetedFilters";
import { Button } from "@/components/ui/button";

interface Props {
  from: Date;
  to: Date;
}

import { download, generateCsv, mkConfig } from "export-to-csv";
import { date } from "zod";
import { DownloadIcon, MoreHorizontal, TrashIcon, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import DeleteTransactionDialog from "./DeleteTransactionDialog";
import EditTransactionDialog from "./EditTransactionDialog";

const emptyData: any[] = [];
type TransactionHistoryRow = GetTransactionHistoryResponseType[0];

const columns: ColumnDef<TransactionHistoryRow>[] = [
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Category"} />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => (
      <div className="flex gap-2 capitalize">
        {row.original.categoryIcon}
        <div className="capipitalize">{row.original.category}</div>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Description"} />
    ),
    cell: ({ row }) => (
      <div className="flex gap-2 capitalize">
        <div className="capipitalize">{row.original.description}</div>
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Date"} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      const formattedDate = date.toLocaleDateString("default", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return <div className="text-muted-foreground">{formattedDate}</div>;
    },
  },
  {
    accessorKey: "type",
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    header: "Type",
    cell: ({ row }) => (
      <div className="flex gap-2 capitalize">
        <div
          className={cn(
            "capipitalize rounded-lg text-center p-2 ",
            row.original.type === "income"
              ? "bg-emerald-400/10 text-emerald-500"
              : "bg-rose-400/10 text-rose-500"
          )}
        >
          {row.original.type}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Amount"} />
    ),
    cell: ({ row }) => (
      <div className="flex">
        <p className="text-md rounded-lg border border-gray-400/5 p-2 text-left font-medium">
          {row.original.formattedAmount}
        </p>
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions transaction={row.original} />,
  },
];

const csvConfig = mkConfig({
  fieldSeparator: ",",
  decimalSeparator: ".",
  useKeysAsHeaders: true,
});
function TransactionTable({ from, to }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const history = useQuery({
    queryKey: ["transaction-history", from, to],
    queryFn: async () =>
      fetch(
        `/api/transaction-history?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`
      ).then((res) => res.json()),
  });

  const handleExportCSV = (data: any[]) => {
    //default file name
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  const table = useReactTable({
    data: history.data || emptyData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // initialState: {
    //   pagination: {
    //     pageSize: 10,
    //   },
    // },
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const categoriesOptions = React.useMemo(() => {
    const categoriesMap = new Map();
    history.data?.forEach(
      (transaction: { category: any; categoryIcon: any }) => {
        categoriesMap.set(transaction.category, {
          value: transaction.category,
          label: `${transaction.categoryIcon} ${transaction.category}`,
        });
      }
    );
    const uniqueCategories = new Set(categoriesMap.values());
    return Array.from(uniqueCategories);
  }, [history.data]);
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-2 py-4">
        <div className="flex gap-2">
          {table.getColumn("category") && (
            <DataTableFacetedFilter
              title="Category"
              column={table.getColumn("category")}
              options={categoriesOptions}
            />
          )}
          {table.getColumn("type") && (
            <DataTableFacetedFilter
              title="Type"
              column={table.getColumn("type")}
              options={[
                { label: "Income", value: "income" },
                { label: "Expense", value: "expense" },
              ]}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const data = table.getFilteredRowModel().rows.map((row) => ({
                category: row.original.category,
                categoryIcon: row.original.categoryIcon,
                description: row.original.description,
                type: row.original.type,
                amount: row.original.amount,
                formattedAmount: row.original.formattedAmount,
                date: row.original.date,
              }));
              handleExportCSV(data);
            }}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <SkeletonWrapper isLoading={history.isFetching}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="px-4">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="px-4"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </SkeletonWrapper>
    </div>
  );
}

export default TransactionTable;

function RowActions({ transaction }: { transaction: TransactionHistoryRow }) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  return (
    <>
      <DeleteTransactionDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        transactionId={transaction.id}
      />
      <EditTransactionDialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        transaction={{
          id: transaction.id,
          type: transaction.type as TransactionType,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          date: new Date(transaction.date),
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-gray-200/10 rounded-md p-2 bg-background"
        >
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={() => {
              setShowDeleteDialog((prev) => !prev);
            }}
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
