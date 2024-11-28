"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Languages } from "@/lib/constants";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/datatable/datatable";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Trash2, Edit2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import URLInput from "@/components/ui/url-input";
import { formatDate } from "@/lib/formatDate";

interface Language {
  id: string;
  name: string;
}

interface Website {
  id: number;
  name: string;
  url: string;
  slug: string;
  languages: string;
  created_at: string;
  modified_at: string;
  author: string;
  description: string;
  thumb: string;
}

export default function AddWebsite() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [author, setAuthor] = useState("");
  const [thumb, setThumb] = useState("");
  // const [categories, setCategories] = useState<Category[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    // fetchCategories();
    fetchLanguages();
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    if (name != "") setSlug(`${name.toLowerCase().replaceAll(" ", "-")}`);
  }, [name]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/delete-website`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete website");
      }
      const data = await response.json();
      console.log(data);
      fetchWebsites();
      window.location.reload();
    } catch (error) {
      console.error("Error deleting website:", error);
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

  const fetchLanguages = async () => {
    try {
      const response = await fetch("/api/add-language");
      if (!response.ok) {
        throw new Error("Failed to fetch languages");
      }
      const data = await response.json();
      setLanguages(data);
    } catch (error) {
      console.error("Error fetching languages:", error);
      setError("Failed to fetch languages");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      // const joined_categories = selectedCategories.join(",");
      const joined_languages = selectedLanguages.join(",");
      console.log(name, url, joined_languages, slug, desc, author, thumb);
      const res = await fetch("/api/add-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          url: "https://" + url,
          languages: joined_languages,
          slug: slug,
          description: desc,
          author: author,
          thumb: thumb,
          // categories: joined_categories,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        console.error("Error adding website:", error);
        return;
      }
      setName("");
      setUrl("");
      setSelectedLanguages([]);
      setDesc("");
      setAuthor("");
      setThumb("");
      setSlug("");

      toast({
        title: "Success!",
        description: "Website added successfully",
      });
      fetchWebsites();
      // setSelectedCategories([]);
    } catch (error) {
      console.error("Error adding website:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Website>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="w-[80px]">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => <div className="w-[80px]">{row.getValue("url")}</div>,
    },
    // {
    //   accessorKey: "slug",
    //   header: "Slug",
    //   cell: ({ row }) => <div className="w-[80px]">{row.getValue("slug")}</div>,
    // },
    {
      accessorKey: "languages",
      header: "Languages",
      cell: ({ row }) => (
        <div className="w-[80px]">{row.getValue("languages")}</div>
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
      accessorKey: "modified_at",
      header: "Modified At",
      cell: ({ row }) => (
        <div className="w-[80px]">
          {formatDate(row.getValue("modified_at"))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant={"outline"} size="sm">
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = websites.filter(
    (data: Website) =>
      data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.url.toString().includes(searchTerm)
  );

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Website</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Website Name</Label>
          <Input
            id="name"
            placeholder="Website Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="feed-url">Website Feed URL</Label>
          {/* <Input
            id="feed-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com"
            required
          /> */}
          <URLInput value={url} setValue={setUrl} />
        </div>
        <div>
          <Label htmlFor="languages">Languages</Label>
          <Select
            onValueChange={(value: string) => setSelectedLanguages([value])}
            value={selectedLanguages[0]}
          >
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang: Language) => (
                <SelectItem key={lang.id} value={lang.name}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="slug">Website Slug</Label>
          <Input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="example-hindi"
            required
          />
        </div>
        <div>
          <Label htmlFor="desc">Website Description</Label>
          <Textarea
            id="desc"
            value={desc}
            className="h-48"
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description goes here..."
          />
        </div>
        <div>
          <Label htmlFor="author">Website Author</Label>
          <Input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="thumb">Default Thumbnail</Label>
          <Input
            id="thumb"
            type="file"
            value={thumb}
            onChange={(e) => setThumb(e.target.value)}
            placeholder="/placeholder.svg"
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          Add Website
        </Button>
      </form>

      <div className="mt-12">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter websites..."
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
    </div>
  );
}
