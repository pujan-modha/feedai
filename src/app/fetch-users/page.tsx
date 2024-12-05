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
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/formatDate";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/datatable/datatable";
import { useFormStatus } from "react-dom";
import { handleSignup } from "../actions";

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  created_at: Date | null;
}
const initialState = {
  error: "",
  success: undefined,
  url: undefined,
};
export default function UserTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const [state, formAction] = React.useActionState(handleSignup, initialState);

  React.useEffect(() => {
    if (state.success) {
      toast({
        title: "Success!",
        description: "Created account successfully!",
      });
      fetchData();
    }
  }, [state]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/fetch-users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data);
      setData(data);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/fetch-users/`, {
        method: "DELETE",
        body: JSON.stringify({ id: id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setData((prevData) => prevData.filter((user) => user.id !== id));
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "default",
        });
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "User ID",
      cell: ({ row }) => <div className="w-full">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "email",
      header: "User Email",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "is_admin",
      header: "User Admin",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("is_admin") ? "Yes" : "No"}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => <div>{formatDate(row.getValue("created_at"))}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isAdmin = row.getValue("is_admin");
        return (
          !isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the user.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(row.getValue("id"))}
                    className="text-white bg-destructive hover:bg-destructive/80"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Make sure this is included
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters, // Make sure columnFilters is included in state
      columnVisibility,
      rowSelection,
    },
  });

  const filteredData = data.filter(
    (data) =>
      data.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.id.toString().includes(searchTerm)
  );
  const LoadingSpinner = () => (
    <div className="w-full h-24 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="w-full p-4">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter users..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
        {/* <Button>
          <Plus className="h-4 w-4" />
          Add User
        </Button> */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="ml-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Add a new user to your account.
              </DialogDescription>
              <form action={formAction} className="space-y-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" className="w-full" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                  />
                </div>
                {state.error && (
                  <p className="text-red-500 text-sm mt-2">{state.error}</p>
                )}
                <SubmitButton />
              </form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          sortValue={sorting[0]?.id}
        />
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Adding user..." : "Add user"}
    </Button>
  );
}
