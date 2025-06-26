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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DownloadIcon,
  MoreHorizontal,
  TrashIcon,
  Edit,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          <span className="text-lg" role="img" aria-label="category">
            {row.original.categoryIcon}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-foreground capitalize">
            {row.original.category}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Description"} />
    ),
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <span className="text-sm text-muted-foreground truncate block">
          {row.original.description || "No description"}
        </span>
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
        month: "short",
        day: "numeric",
      });
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{formattedDate}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === "income" ? "default" : "destructive"}
        className={cn(
          "font-medium text-xs px-3 py-1",
          row.original.type === "income"
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
            : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/20 dark:text-rose-400"
        )}
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Amount"} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span
          className={cn(
            "font-semibold text-lg",
            row.original.type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          {row.original.type === "income" ? "+" : "-"}
          {row.original.formattedAmount}
        </span>
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
    queryFn: async () => {
      const response = await fetch(
        `/api/transaction-history?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const handleExportCSV = (data: any[]) => {
    //default file name
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  const handleExportPDF = (data: any[]) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString("default", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Professional header with border
    doc.setDrawColor(255, 165, 0);
    doc.setLineWidth(2);
    doc.line(20, 30, 195, 30);

    // Add Finora logo text
    doc.setFontSize(28);
    doc.setTextColor(255, 165, 0);
    doc.setFont("helvetica", "bold");
    doc.text("FINORA", 20, 25);

    // Add subtitle
    doc.setFontSize(18);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text("Financial Transaction Report", 20, 40);

    // Add download date with professional styling
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Report Generated: ${currentDate}`, 140, 25);

    // Add date range info if data exists
    if (data.length > 0) {
      const fromDate = new Date(data[0]?.date || new Date()).toLocaleDateString(
        "default",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
      const toDate = new Date(
        data[data.length - 1]?.date || new Date()
      ).toLocaleDateString("default", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      doc.text(`Period: ${toDate} - ${fromDate}`, 140, 35);
    }

    // Prepare table data with color information
    const tableData = data.map((row) => [
      row.category,
      row.description || "No description",
      new Date(row.date).toLocaleDateString("default", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      row.type.charAt(0).toUpperCase() + row.type.slice(1),
      row.formattedAmount,
    ]);

    // Create table with enhanced styling
    autoTable(doc, {
      head: [["Category", "Description", "Date", "Type", "Amount"]],
      body: tableData,
      startY: 55,
      theme: "striped",
      headStyles: {
        fillColor: [255, 165, 0],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "left" }, // Category - KEEP AS IS
        1: { cellWidth: 45, halign: "left" }, // Description - KEEP AS IS
        2: { cellWidth: 30, halign: "center" }, // Date - KEEP AS IS
        3: { cellWidth: 24, halign: "center" }, // Type - KEEP AS IS
        4: { cellWidth: 40, halign: "left" }, // Amount - KEEP AS IS
      },
      margin: { top: 55, left: 20, right: 15 },
      tableWidth: "auto",
      showHead: "everyPage",
      didParseCell: (data) => {
        // Color code the amount column based on transaction type (only for body cells, not headers)
        if (data.column.index === 4 && data.section === "body") {
          // Amount column - body cells only
          const rowIndex = data.row.index;
          const transactionType = tableData[rowIndex][3]; // Type column

          if (transactionType === "Income") {
            data.cell.styles.textColor = [34, 139, 34]; // Green for income
            data.cell.styles.fontStyle = "bold";
          } else if (transactionType === "Expense") {
            data.cell.styles.textColor = [220, 20, 60]; // Red for expense
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Add footer with total summary
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, finalY + 10, 190, finalY + 10);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Total Transactions: ${data.length}`, 20, finalY + 20);
    doc.text(
      "Generated by Finora Financial Management System",
      20,
      finalY + 25
    );

    // Save the PDF
    const fileName = `finora-transactions-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  const table = useReactTable({
    data: history.data || emptyData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
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
    <div className="w-full space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-card rounded-lg border shadow-sm">
        <div className="flex flex-wrap gap-3">
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
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
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
          <Button
            variant="outline"
            size="sm"
            className="h-9"
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
              handleExportPDF(data);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Table */}
      <SkeletonWrapper isLoading={history.isFetching}>
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="px-6 py-4 font-semibold"
                      >
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
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/25",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
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
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-muted p-3">
                        <DollarSign className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">
                          No transactions found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your filters or date range
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} transaction(s)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
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
          <Button variant={"ghost"} className="h-8 w-8 p-0 hover:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-45">
          <DropdownMenuLabel className="font-semibold">
            Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onSelect={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Edit transaction
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            onSelect={() => {
              setShowDeleteDialog((prev) => !prev);
            }}
          >
            <TrashIcon className="h-4 w-4 text-destructive" />
            Delete transaction
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
