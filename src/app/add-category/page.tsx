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
import { Eye, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

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

import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatDate";

interface Category {
  id: string;
  name: string;
  slug: string;
  value: string;
  is_parent: boolean;
  created_at: string;
  parent_id: string;
  website_name: string;
  website_slug: string;
  children?: Category[];
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

  // New state for filters
  const [selectedWebsiteFilter, setSelectedWebsiteFilter] =
    useState<string>("all");
  const [selectedParentCategoryFilter, setSelectedParentCategoryFilter] =
    useState<string>("all");

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
      window.location.reload();
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const getParentCategoryFromId = (category_id: string) => {
    const parent_category = categories.find(
      (category) => category.id === category_id
    );
    return { name: parent_category?.name, slug: parent_category?.slug };
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

  const handleDeleteCategory = async (category_id: number) => {
    try {
      const data = await fetch(`/api/delete-category`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: category_id,
        }),
      });
      if (!data.ok) {
        throw new Error("Failed to delete category");
      }
      const response = await data.json();
      const category_name = response.deleted_category.name;
      toast({
        title: "Category Deleted",
        description: `Category ${category_name} has been deleted. Please delete the related articles in the article master manually.`,
      });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again later.",
      });
    }
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
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.original.children && row.original.children.length > 0 ? (
          <Button
            variant="ghost"
            onClick={row.getToggleExpandedHandler()}
            className="w-6 h-6 p-0"
          >
            {row.getIsExpanded() ? "▼" : "►"}
          </Button>
        ) : null;
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      accessorKey: "parent_id",
      header: "Parent Category",
      cell: ({ row }) => {
        const category = getParentCategoryFromId(row.getValue("parent_id"));
        return <div className="w-full">{category.name || "-"}</div>;
      },
    },
    {
      accessorKey: "website_name",
      header: "Website",
      cell: ({ row }) => (
        <div className="w-full">{row.getValue("website_name")}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => (
        <div className="w-full">{formatDate(row.getValue("created_at"))}</div>
      ),
    },
    {
      header: "Feed URL",
      cell: ({ row }) => (
        <div className="w-full">
          {
            <a
              href={`${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${row.original.website_slug}/${row.original.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${row.original.website_slug}/${row.original.slug}/`}
            </a>
          }
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  category.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    handleDeleteCategory(parseInt(row.original.id))
                  }
                  className="text-white bg-destructive hover:bg-destructive/80"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const filteredCategories = categories.filter((data: Category) => {
    const matchesSearch =
      data.slug.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      getParentCategoryFromId(data.parent_id)
        .slug?.toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesWebsite =
      selectedWebsiteFilter === "all" ||
      data.website_name === selectedWebsiteFilter;
    const matchesParentCategory =
      selectedParentCategoryFilter === "all" ||
      (selectedParentCategoryFilter === "parent" && data.is_parent) ||
      getParentCategoryFromId(data.parent_id).name ===
        selectedParentCategoryFilter;

    return matchesSearch && matchesWebsite && matchesParentCategory;
  });

  const exportToExcel = () => {
    // Prepare the data for export
    const exportData = filteredCategories.map((category) => ({
      "Name": category.name,
      "Slug": category.slug,
      "Parent Category":
        getParentCategoryFromId(category.parent_id).name || "-",
      "Website": category.website_name,
      "Created At": formatDate(category.created_at),
      "Feed URL": category.is_parent
        ? "-"
        : `${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${category.website_slug}/${category.slug}/`,
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

    // Generate the Excel file
    XLSX.writeFile(workbook, "categories.xlsx");
  };

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
          <Select
            value={selectedWebsiteFilter}
            onValueChange={setSelectedWebsiteFilter}
            className="ml-4"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Website" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Websites</SelectItem>
              {websites.map((website) => (
                <SelectItem key={website.id} value={website.name}>
                  {website.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* <Select
            value={selectedParentCategoryFilter}
            onValueChange={setSelectedParentCategoryFilter}
            className="ml-4"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Parent Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="parent">Parent Categories</SelectItem>
              {categories
                .filter((category) => category.is_parent)
                .map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select> */}
          <Button onClick={exportToExcel} className="ml-auto">
            Export to Excel
          </Button>
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
