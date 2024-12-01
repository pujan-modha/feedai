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
import { ArrowUpDown, ChevronDown, Edit2, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/datatable/datatable";
import { formatDate } from "@/lib/formatDate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

// Define the Task type based on the specified fields
type Task = {
  id: number;
  feed_url: string;
  feed_config: string;
  created_at: Date | null;
  articles_count: number | null;
  start_time: Date | null;
  end_time: Date | null;
  status: string;
  error_count: number | null;
  sucess_count: number | null;
};

interface Website {
  id: number;
  name: string;
}

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
  const [editPrompt, setEditPrompt] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const response = await fetch("/api/fetch-tasks");
    const data = await response.json();
    setData(data);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/delete-task`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      const data = await response.json();
      console.log(data);
      fetchData();
      toast({
        title: "Success!",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleGetVersion = (feed_config: string) => {
    const versions = JSON.parse(feed_config)["num_articles"];
    return versions;
  };

  const handleGetWebsites = (feed_config: string) => {
    const websites: Website[] = JSON.parse(feed_config)["selected_websites"];
    const websie_csv = websites
      .map((website: Website) => website.name)
      .join(", ");
    return websie_csv;
  };

  const handleEditPrompt = async (
    id: string,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    try {
      e.preventDefault();
      setIsSaving(true);
      console.log(id);
      const formElements = e.target as HTMLFormElement;
      const promptInput = formElements.querySelector(
        "#feed-prompt"
      ) as HTMLInputElement;
      if (!promptInput.value) {
        throw new Error("Please enter a prompt");
      }
      const res = await fetch("/api/edit-task", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          userprompt: promptInput.value,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update task");
      }
      toast({
        title: "Success!",
        description: "Prompt updated successfully for task ID " + id,
      });
      fetchData();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setEditPrompt("");
      setIsSaving(false);
    }
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-full">{row.getValue("id")}</div>,
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
      cell: ({ row }) => <div>{formatDate(row.getValue("created_at"))}</div>,
    },
    {
      accessorKey: "modified_at",
      header: "Modified At",
      cell: ({ row }) => <div>{formatDate(row.getValue("modified_at"))}</div>,
    },
    {
      accessorKey: "articles_count",
      header: "Articles Count",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("articles_count")}</div>
      ),
    },
    {
      header: "Versions",
      cell: ({ row }) => (
        <div className="text-center">
          {handleGetVersion(row.original["feed_config"])}
        </div>
      ),
    },
    {
      header: "Websites",
      cell: ({ row }) => (
        <div className="text-center">
          {handleGetWebsites(row.original["feed_config"])}
        </div>
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
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit prompt</DialogTitle>
                  <DialogDescription>
                    Make changes to the prompt here.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-2"
                  onSubmit={(e) => handleEditPrompt(row.getValue("id"), e)}
                >
                  <div className="gap-4 py-4">
                    <Textarea
                      id="feed-prompt"
                      defaultValue={JSON.parse(task.feed_config)["userprompt"]}
                      className="h-64"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                      Save prompt
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-destructive text-left pl-0 bg-transparent hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the task.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-white bg-destructive hover:bg-destructive/80"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const filteredData = data.filter(
    (data) =>
      data.feed_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.id.toString().includes(searchTerm) ||
      data.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
