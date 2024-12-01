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
import { ChevronDown, Eye } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatDate";

interface Category {
  id: string;
  name: string;
  slug: string;
  value: string;
  created_at: string;
  website_name: string;
  website_slug: string;
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
  const [successCategoryMessage] = useState("");
  const [websites, setWebsites] = useState<Website[]>([]);
  const [website_id, setWebsiteId] = useState<string>("");

  // For Tabular Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [website_categories, setWebsiteCategories] = useState<Category[]>([]);
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
      fetchCategories();
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

  const handleCategoryViaWebsite = async () => {
    const data = await fetch(`/api/fetch-category-from-website`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        website_id: website_id,
      }),
    });
    if (!data.ok) {
      throw new Error("Failed to fetch categories");
    }
    const response = await data.json();
    console.log(response);
    setWebsiteCategories(response.website_categories);
  };

  useEffect(() => {
    if (website_id) {
      console.log(website_id);
      handleCategoryViaWebsite();
      // Reset parent category to default when website changes
      setIsParentCategory(true);
      setParentCategoryId("parent-category");
    }
  }, [website_id]);

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "website_name",
      header: "Website",
      cell: ({ row }) => (
        <div className="w-[80px]">{row.getValue("website_name")}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => (
        <div className="w-[80px]">{formatDate(row.getValue("created_at"))}</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div>
          <Button
            size="sm"
            onClick={() =>
              window.open(
                `${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${row.original["website_slug"]}/${row.original["slug"]}/`,
                "_blank"
              )
            }
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: categories,
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
      data.slug.toString().includes(searchTerm) ||
      data.website_name.toString().includes(searchTerm) ||
      data.website_slug.toString().includes(searchTerm)
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
          <Label htmlFor="website">Website</Label>
          <Select
            onValueChange={(value) => {
              setWebsiteId(value);
            }}
          >
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
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={category_name}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Cricket"
            required
          />
        </div>
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
          <Label htmlFor="p-category">Parent Category</Label>
          <Select
            onValueChange={(value) => handleParentCategory(value)}
            value={parent_category_id}
          >
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent-category">
                This is Parent Category
              </SelectItem>
              {website_categories.map((category) => (
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
