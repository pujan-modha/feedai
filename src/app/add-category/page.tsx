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
  const [category, setCategory] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [successCategoryMessage, setSuccessCategoryMessage] = useState("");
  const [websites, setWebsites] = useState<Website[]>([]);
  const [successBulkCategoryMessage, setSuccessBulkCategoryMessage] =
    useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchWebsites();
  }, []);

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
    console.log(category, categorySlug, subCategories.join(","));
    try {
      e.preventDefault();
      const res = await fetch("/api/add-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: category,
          slug: categorySlug,
          value: subCategories.join(","),
        }),
      });
      if (!res.ok) {
        console.log(await res.json());
        throw new Error("Failed to add category");
      }
      setSuccessCategoryMessage("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleCategory = (category: string) => {
    setCategory(category);
    setSubCategories(subCategories);
    const slugged_category = category.trim().toLowerCase().replaceAll(" ", "-");
    setCategorySlug(slugged_category);
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Name",
      
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      accessorKey: "value",
      header: "Subcategories",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="space-x-2 flex items-center justify-center">
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
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

  const table = useReactTable({
    websites,
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
            value={category}
            onChange={(e) => handleCategory(e.target.value)}
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
          <Select onValueChange={(value) => handleCategory(value)}>
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a website" />
            </SelectTrigger>
            <SelectContent>
              {websites.map((website) => (
                <SelectItem key={website.id} value={website.name}>
                  {website.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-category">Parent Category</Label>
          <Select onValueChange={(value) => handleCategory(value)}>
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a website" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
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
          data={filteredCategories}
          sortValue={sorting[0]?.id}
        />
      </div>
    </div>
  );
}
