"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/datatable/datatable";
import { formatDate } from "@/lib/formatDate";

// Define the Task type based on the specified fields
type Task = {
  id: number;
  feed_url: string;
  created_at: Date | null;
  articles_count: number | null;
  start_time: Date | null;
  end_time: Date | null;
  status: string;
  error_count: number | null;
  sucess_count: number | null;
};

// Define the columns for the specified fields
const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "feed_url",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Feed URL
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("feed_url")}</div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <div>{row.getValue("created_at")?.toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "modified_at",
    header: "Modified At",
    cell: ({ row }) => (
      <div>{row.getValue("modified_at")?.toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "articles_count",
    header: "Articles Count",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("articles_count")}</div>
    ),
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    cell: ({ row }) => <div>{formatDate(row.getValue("start_time"))}</div>,
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    cell: ({ row }) => <div>{formatDate(row.getValue("start_time"))}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "error_count",
    header: "Error Count",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("error_count")}</div>
    ),
  },
  {
    accessorKey: "sucess_count",
    header: "Success Count",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("sucess_count")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(task.id.toString())}
            >
              Copy task ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function TasksTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<Task[]>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/fetch-tasks");
      const data = await response.json();
      setData(data);
    };
    fetchData();
    // Add an empty dependency array to run the effect only once
  }, []);

  const filteredData = data.filter(
    (data) =>
      data.feed_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.id.toString().includes(searchTerm) ||
      data.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full p-8">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter tasks..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        sortValue={sorting[0]?.id}
      />
    </div>
  );
}
