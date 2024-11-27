"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DataTable } from "@/components/datatable/datatable";
import { ChevronDown, Trash2, Edit2, Eye } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  value: string;
  created_at: string;
}

interface Website {
  id: string;
  name: string;
}

export default function AddCategory() {
  const [category_name, setCategoryName] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [parent_category_id, setParentCategoryId] =
    useState<string>("parent-category");
  const [isParentCategory, setIsParentCategory] = useState<boolean>(true);
  const [successCategoryMessage, setSuccessCategoryMessage] = useState("");
  const [websites, setWebsites] = useState<Website[]>([]);
  const [website_id, setWebsiteId] = useState<string>("");
  const [successBulkCategoryMessage, setSuccessBulkCategoryMessage] =
    useState("");

  // For Tabular Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchWebsites();
  }, []);

  useEffect(() => {
    setCategorySlug(category_name.toLowerCase().replaceAll(" ", "-").trim());
  }, [category_name]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/fetch-categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      console.log(data);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchWebsites = async () => {
    try {
      const response = await fetch("/api/fetch-websites");
      if (!response.ok) {
        throw new Error("Failed to fetch websites");
      }
      const data = await response.json();
      console.log(data);
      setWebsites(data);
    } catch (error) {
      console.error("Error fetching websites:", error);
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const res = await fetch("/api/add-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: category_name,
          slug: categorySlug,
          parent_category_id: parent_category_id,
          is_parent: isParentCategory,
          website_id: website_id,
        }),
      });
      if (!res.ok) {
        console.log(await res.json());
        throw new Error("Failed to add category");
      }
      toast({
        title: "Success!",
        description: `Category ${category_name} added successfully`,
      });
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleParentCategory = (category_id: string) => {
    if (category_id === "parent-category") {
      setIsParentCategory(true);
      setParentCategoryId("parent-category");
    } else {
      setParentCategoryId(category_id);
      setIsParentCategory(false);
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="space-x-2 flex items-center justify-center">
          <Button variant="outline" size="sm">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {console.log(website_id)},[website_id])

  const table = useReactTable({
    categories,
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

  const filteredCategories = categories.filter(
    (data: Category) =>
      data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.slug.toString().includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Category</h1>
      {successCategoryMessage && (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <p className="text-green-700">{successCategoryMessage}</p>
        </div>
      )}
      <form onSubmit={handleSubmitCategory} className="space-y-4">
        <div>
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={category_name}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Cricket"
            required
          />
        </div>
        {/* <div>
            <Label htmlFor="name">Subcategories (Comma separated)</Label>
            <Input
              id="sub-categories"
              value={subCategories}
              onChange={(e) => setSubCategories(e.target.value.split(","))}
              placeholder="local,national,international"
              required
            />
          </div> */}
        <div>
          <Label htmlFor="category-slug">Category Slug</Label>
          <Input
            id="category-slug"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            placeholder="cricket"
            required
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Select onValueChange={(value) => {setWebsiteId(value)}}>
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a website" />
            </SelectTrigger>
            <SelectContent>
              {websites.map((website) => (
                <SelectItem key={website.id} value={website.id.toString()}>
                  {website.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-category">Parent Category</Label>
          <Select
            onValueChange={(value) => handleParentCategory(value)}
            defaultValue="parent-category"
          >
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent-category">
                This is Parent Category
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Add Category</Button>
      </form>

      <div className="mt-12">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter categories..."
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
          data={filteredCategories}
          sortValue={sorting[0]?.id}
        />
      </div>
    </div>
  );
}
