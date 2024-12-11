"use client";
import React, { useEffect, useState } from "react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/datatable/datatable";
import { formatDate } from "@/lib/formatDate";
import { Input } from "@/components/ui/input";

interface Log {
  id: string;
  message: string;
  category: string;
  created_at: string;
}

export default function Logs() {
  const [sorting] = React.useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  //   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
  //     []
  //   );
  //   const [columnVisibility, setColumnVisibility] =
  //     React.useState<VisibilityState>({});
  //   const [rowSelection, setRowSelection] = React.useState({});

  const [data, setData] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/fetch-logs");
        const result = await response.json();
        setData(result.data);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (error) {
    return <div className="p-4 text-red-500">Error: Failed to load logs</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  const columns: ColumnDef<typeof Logs>[] = [
    {
      accessorKey: "id",
      header: "Article ID",
      cell: ({ row }) => <div className="w-full">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <div className="w-full">{row.getValue("message")}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Log category",
      cell: ({ row }) => (
        <div className="w-full">{row.getValue("category")}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Logged at",
      cell: ({ row }) => (
        <div className="w-full">{formatDate(row.getValue("created_at"))}</div>
      ),
    },
  ];

  const filteredData = data.filter(
    (data) =>
      data.message.toString().includes(searchTerm) ||
      data.category.toString().includes(searchTerm)
  );

  return (
    <div className="w-full p-4">
      <Input
        placeholder="Filter articles..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filteredData}
        sortValue={sorting[0]?.id}
      />
    </div>
  );
}
