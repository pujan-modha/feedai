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
import { formatDate } from "@/lib/formatDate";

// Define the GeneratedArticle type based on the schema
type GeneratedArticle = {
  id: number;
  task_id: number;
  title: string;
  content: string;
  created_at: Date | null;
  seo_title: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  summary: string | null;
  primary_category: string | null;
  secondary_category: string | null;
};

import { DataTable } from "@/components/datatable/datatable";

// Define the columns
const columns: ColumnDef<GeneratedArticle>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "task_id",
    header: "Task ID",
    cell: ({ row }) => (
      <div className="w-[80px]">{row.getValue("task_id")}</div>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{row.getValue("content")}</div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => <div>{formatDate(row.getValue("created_at"))}</div>,
  },
  {
    accessorKey: "seo_title",
    header: "SEO Title",
    cell: ({ row }) => <div>{row.getValue("seo_title")}</div>,
  },
  {
    accessorKey: "meta_title",
    header: "Meta Title",
    cell: ({ row }) => <div>{row.getValue("meta_title")}</div>,
  },
  {
    accessorKey: "meta_description",
    header: "Meta Description",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.getValue("meta_description")}
      </div>
    ),
  },
  {
    accessorKey: "meta_keywords",
    header: "Meta Keywords",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.getValue("meta_keywords")}
      </div>
    ),
  },
  {
    accessorKey: "summary",
    header: "Summary",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{row.getValue("summary")}</div>
    ),
  },
  {
    accessorKey: "primary_category",
    header: "Primary Category",
    cell: ({ row }) => (
      <div className="text-nowrap">{row.getValue("primary_category")}</div>
    ),
  },
  {
    accessorKey: "secondary_category",
    header: "Secondary Category",
    cell: ({ row }) => (
      <div className="text-nowrap">{row.getValue("secondary_category")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const article = row.original;

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
              onClick={() =>
                navigator.clipboard.writeText(article.id.toString())
              }
            >
              Copy article ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View article</DropdownMenuItem>
            <DropdownMenuItem>Edit article</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function GeneratedArticlesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<GeneratedArticle[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/fetch-articles");
      const data = await response.json();
      setData(data);
    };
    fetchData();
    // Add an empty dependency array to run the effect only once
  }, []);

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

  const filteredData = data.filter(
    (data) =>
      data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.task_id.toString().includes(searchTerm)
  );

  return (
    <div className="w-full p-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter articles..."
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
