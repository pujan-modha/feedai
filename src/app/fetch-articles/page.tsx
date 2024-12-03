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
import { ArrowUpDown, ChevronDown, Eye, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  website_slug: string;
};

import { DataTable } from "@/components/datatable/datatable";

interface Website {
  id: number;
  name: string;
  slug: string;
  categories: Array<number>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

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
  const { toast } = useToast();
  const [websites, setWebsites] = React.useState<Website[]>([]); // Populate with your websites
  const [categories, setCategories] = React.useState<string[]>([]); // Populate with your categories
  const [selected_id, setSelected_id] = React.useState<string | null>(null);
  const [selectedWebsite, setSelectedWebsite] = React.useState<string | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = React.useState<
    string | undefined
  >();

  const [availableCategories, setAvailableCategories] = React.useState<
    Category[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/fetch-articles");
      const data = await response.json();
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

  React.useEffect(() => {
    const getArticleFilter = async () => {
      const res = await fetch("/api/fetch-websites", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const websites = await res.json();
      setWebsites(websites);
    };
    getArticleFilter();
  }, [data]);

  React.useEffect(() => {
    const getCategoriesFromWebsite = async () => {
      if (selectedWebsite) {
        const res = await fetch("/api/fetch-category-from-website", {
          method: "POST",
          body: JSON.stringify({
            website_id: selected_id,
            want_child: true,
          }),
        });

        const websiteCategories = await res.json();
        console.log(websiteCategories);
        setAvailableCategories(websiteCategories.website_categories);
      } else {
        setAvailableCategories([]);
      }
    };
    getCategoriesFromWebsite();
  }, [selected_id, selectedWebsite]);

  const handleDeleteArticle = async (id: number) => {
    try {
      const response = await fetch(`/api/delete-article`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete article");
      }
      const data = await response.json();
      console.log(data);
      fetchData();
      toast({
        title: "Success!",
        description: "Article deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<GeneratedArticle>[] = [
    {
      accessorKey: "id",
      header: "Article ID",
      cell: ({ row }) => <div className="w-full">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },

    {
      accessorKey: "website_slug",
      header: "Website",
      cell: ({ row }) => (
        <div className="font-medium capitalize">
          {row.original.website_slug
            ? row.original.website_slug.replaceAll("-", " ")
            : "Unknown"}
        </div>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, filterValue) => {
        return row.getValue(id) === filterValue;
      },
    },

    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => <div>{formatDate(row.getValue("created_at"))}</div>,
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
      accessorKey: "thumb_image",
      header: "Thumbnail Image",
      cell: ({ row }) => (
        <a href={row.getValue("thumb_image")}>{row.getValue("thumb_image")}</a>
      ),
    },
    {
      id: "category",
      header: "",
      enableColumnFilter: true,
      filterFn: (row, id, filterValue) => {
        return (
          row.original.primary_category_slug === filterValue ||
          row.original.secondary_category_slug === filterValue
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const article = row.original;

        return (
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold mb-4">
                    Article Details
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem label="Task ID" value={row.original.task_id} />
                  <DetailItem label="Title" value={row.original.title} />
                  <DetailItem
                    label="Created At"
                    value={formatDate(row.original.created_at)}
                  />
                  <DetailItem
                    label="SEO Title"
                    value={row.original.seo_title}
                  />
                  <DetailItem
                    label="Meta Title"
                    value={row.original.meta_title}
                  />
                  <DetailItem
                    label="Meta Keywords"
                    value={JSON.parse(row.original.meta_keywords!).join(", ")}
                  />

                  <DetailItem
                    label="Secondary Category"
                    value={row.original.secondary_category}
                  />

                  <DetailItem
                    label="Primary Category"
                    value={row.original.primary_category}
                  />
                  <div className="col-span-full">
                    <DetailItem
                      label="Meta Description"
                      value={row.original.meta_description}
                    />
                  </div>
                  <div className="col-span-full">
                    <DetailItem
                      label="Thumbnail Image"
                      value={<img src={row.original.thumb_image} />}
                    />
                  </div>
                  <div className="col-span-full">
                    <DetailItem label="Summary" value={row.original.summary} />
                  </div>
                  <div className="col-span-full">
                    <DetailItem label="Content" value={row.original.content} />
                  </div>
                </div>
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
                    the article.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteArticle(row.original.id)}
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
      data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.task_id.toString().includes(searchTerm)
  );

  // Update WebsiteFilter component
  const WebsiteFilter = () => {
    return (
      <Select
        value={selectedWebsite || undefined}
        onValueChange={(value: string) => {
          const parsed_value = JSON.parse(value);
          setSelectedWebsite(parsed_value.name);
          setSelected_id(parsed_value.id);
          setColumnFilters((prev) => [
            ...prev.filter((f) => f.id !== "website_slug"),
            { id: "website_slug", value: parsed_value.slug },
          ]);
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Website">
            {selectedWebsite ? selectedWebsite : "Select Website"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {websites
            .filter((website) => website) // Remove null/undefined
            .map((website) => (
              <SelectItem
                key={website.id}
                value={JSON.stringify({
                  slug: website.slug,
                  id: website.id,
                  name: website.name,
                })}
              >
                {website.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    );
  };

  // Update CategoryFilter component
  const CategoryFilter = () => {
    return (
      <Select
        value={selectedCategory || undefined}
        disabled={!selectedWebsite || isLoading}
        onValueChange={(value: string) => {
          const parsed_value = JSON.parse(value);
          setSelectedCategory(parsed_value.name);
          setColumnFilters((prev) => [
            ...prev.filter((f) => f.id !== "category"),
            { id: "category", value: parsed_value.slug },
          ]);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Category">
            {selectedCategory}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableCategories.map((category) => (
            <SelectItem
              key={category.id}
              value={JSON.stringify({
                slug: category.slug,
                id: category.id,
                name: category.name,
              })}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const LoadingSpinner = () => (
    <div className="w-full h-24 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
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

      <div className="flex gap-4 py-4">
        <WebsiteFilter />
        <CategoryFilter />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={
            selectedWebsite
              ? table.getFilteredRowModel().rows.map((row) => row.original)
              : []
          }
          sortValue={sorting[0]?.id}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="space-y-1">
      <h4 className="font-medium text-sm text-gray-500">{label}</h4>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function ArticleComponent({ article }: { article: Article }) {
  return (
    <>
      <Card className="w-full max-w-full mx-auto">
        <CardHeader>
          <CardTitle>{article.title}</CardTitle>
          <div className="flex space-x-2 mt-2">
            <Badge variant="default">{article.primary_category}</Badge>
            <Badge variant="outline">{article.secondary_category}</Badge>
          </div>
          <span className="font-semibold">Thumbnail</span>
          <img
            src={article.thumbnail_image}
            alt={article.title}
            className="w-full object-cover"
          />
        </CardHeader>

        <CardContent>
          <div
            className="prose max-w-none mb-8 bg-gray-200 p-4 rounded-lg"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          <div className="mt-8 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">SEO-Friendly Title</h3>
              <p>{article.seo_title}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Meta Information</h3>
              <ul className="list-disc pl-5">
                <li>
                  <strong>Title:</strong> {article.meta_title}
                </li>
                <li>
                  <strong>Description:</strong> {article.meta_description}
                </li>
                <li>
                  <strong>Keywords:</strong> {article.meta_keywords.join(", ")}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Summary</h3>
              <p>{article.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
