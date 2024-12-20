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
import { ChevronDown, Trash2, Edit2, Eye } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import URLInput from "@/components/ui/url-input";
import { formatDate } from "@/lib/formatDate";

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
  const languages: Array<string> = Languages;
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [author, setAuthor] = useState("");
  const [thumb, setThumb] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  const [edited_website_desc, setEditedWebsiteDesc] = useState("");
  const [edited_website_author, setEditedWebsiteAuthor] = useState("");
  const [edited_website_id, setEditedWebsiteId] = useState("");
  const [edited_website_language, setEditedWebsiteLanguage] = useState("");
  useState<File | null>(null);
  const [edited_website_url, setEditedWebsiteUrl] = useState("");
  const [editedWebsiteThumb, setEditedWebsiteThumb] = useState<File | null>(
    null
  );
  const [editedThumbPreview, setEditedThumbPreview] = useState<string | null>(
    null
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  // const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    console.log(editedWebsiteThumb);
  }, [editedWebsiteThumb]);

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

  const handleEditWebsite = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const formElements = e.target as HTMLFormElement;
      const descInput = formElements.querySelector(
        "#website_desc"
      ) as HTMLInputElement;
      const authorInput = formElements.querySelector(
        "#website_author"
      ) as HTMLInputElement;
      const thumbInput = formElements.querySelector(
        "#website_thumb"
      ) as HTMLInputElement;
      const urlInput = formElements.querySelector(
        "#website_url"
      ) as HTMLInputElement;
      if (
        !descInput.value ||
        !authorInput.value ||
        !urlInput.value ||
        !edited_website_language
      ) {
        throw new Error("Please fill all the fields");
      }
      console.log(
        descInput.value,
        authorInput.value,
        thumbInput.value,
        urlInput.value
      );
      const res = await fetch("/api/edit-website", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          desc: descInput.value,
          author: authorInput.value,
          languages: edited_website_language,
          thumb: editedWebsiteThumb,
          url: edited_website_url,
          id: edited_website_id,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update website");
      }
      toast({
        title: "Success!",
        description: "Website updated successfully",
      });
      fetchWebsites();
    } catch (error) {
      console.error("Error updating website:", error);
      toast({
        title: "Error",
        description: "Failed to update website",
        variant: "destructive",
      });
    } finally {
      setEditedWebsiteDesc("");
      setEditedWebsiteAuthor("");
      setEditedWebsiteId("");
      setDialogOpen(false);
    }
  };

  useEffect(() => {
    console.log(thumb);
  }, [thumb]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      const joined_languages = selectedLanguages.join(",");
      const form = new FormData();
      form.append("name", name);
      form.append("url", "https://" + url);
      form.append("languages", joined_languages);
      form.append("slug", slug);
      form.append("description", desc);
      form.append("author", author);
      if (thumb) {
        form.append("thumb", thumb);
        console.log("Appended thumb");
      }

      const res = await fetch("/api/add-website", {
        method: "POST",
        body: form,
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
      setThumb(null);
      setSlug("");

      toast({
        title: "Success!",
        description: "Website added successfully",
      });

      // refresh
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 2000);
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
      cell: ({ row }) => <div className="w-full">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="w-full">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <div className="w-full">{row.getValue("slug")}</div>,
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => <div className="w-full">{row.getValue("url")}</div>,
    },
    {
      accessorKey: "thumb",
      header: "Default Image",
      cell: ({ row }) => (
        <div className="w-full">
          <img
            src={row.getValue("thumb")}
            alt={row.getValue("slug") + " thumbnail"}
            className="w-20 h-full"
          />
        </div>
      ),
    },
    // {
    //   accessorKey: "slug",
    //   header: "Slug",
    //   cell: ({ row }) => <div className="w-full">{row.getValue("slug")}</div>,
    // },
    {
      accessorKey: "languages",
      header: "Languages",
      cell: ({ row }) => (
        <div className="w-full">{row.getValue("languages")}</div>
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
      accessorKey: "modified_at",
      header: "Modified At",
      cell: ({ row }) => (
        <div className="w-full">{formatDate(row.getValue("modified_at"))}</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-center">
          <Button
            size="sm"
            onClick={() =>
              window.open(
                `${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${row.original["slug"]}/`,
                "_blank"
              )
            }
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditedWebsiteDesc(row.original["description"]);
                  setEditedWebsiteLanguage(row.getValue("languages"));
                  setEditedWebsiteUrl(row.getValue("url"));
                  setEditedWebsiteAuthor(row.original["author"]);
                  setEditedWebsiteId(row.getValue("id"));
                  setEditedWebsiteThumb(null);
                  setEditedThumbPreview(row.original["thumb"]);
                  setDialogOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {`Edit website ${row.getValue("name")}`}
                </DialogTitle>
              </DialogHeader>
              <form
                className="space-y-2"
                onSubmit={(e) => handleEditWebsite(e)}
              >
                <div>
                  <Label htmlFor="website_language">
                    Edit Website Language
                  </Label>
                  <Select
                    onValueChange={(value: string) =>
                      setEditedWebsiteLanguage(value)
                    }
                    value={edited_website_language}
                  >
                    <SelectTrigger id="website" className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang: string, idx: number) => (
                        <SelectItem key={idx} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="website_desc">Edit Website Description</Label>
                  <Textarea
                    id="website_desc"
                    name="desc"
                    defaultValue={edited_website_desc}
                  />

                  <Label htmlFor="website_thumb">Edit Website Thumb</Label>
                  <Input
                    type="file"
                    id="website_thumb"
                    name="thumb"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditedWebsiteThumb(file);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setEditedThumbPreview(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept=".png, .jpg, .jpeg, .svg, .gif, .webp"
                  />
                  {editedThumbPreview && (
                    <div className="mt-2">
                      <img
                        src={editedThumbPreview}
                        alt="Edited Thumbnail preview"
                        className="max-w-xs h-auto"
                      />
                    </div>
                  )}

                  <Label htmlFor="website_url">Edit Website URL</Label>
                  <Input
                    defaultValue={edited_website_url}
                    type="text"
                    id="website_url"
                    name="url"
                  />

                  <Label htmlFor="website_author">Edit Website Author</Label>
                  <Input
                    type="text"
                    id="website_author"
                    name="author"
                    defaultValue={edited_website_author}
                  />
                </div>
                <Button type="submit">Submit</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
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
          <Label htmlFor="feed-url">Website URL</Label>
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
          <Label htmlFor="languages">Language</Label>
          <Select
            onValueChange={(value: string) => setSelectedLanguages([value])}
            value={selectedLanguages[0]}
          >
            <SelectTrigger id="website" className="w-full">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang: string, idx: number) => (
                <SelectItem key={idx} value={lang}>
                  {lang}
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
            className="hover:cursor-pointer"
            onChange={(e) => {
              if (e.target.files) {
                setThumb(e.target.files[0]);
              }
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setThumbPreview(event.target?.result as string);
                };
                reader.readAsDataURL(e.target.files[0]);
              }
            }}
            placeholder="/placeholder.svg"
            accept=".png, .jpg, .jpeg, .svg, .gif, .webp,"
          />
          {thumbPreview && (
            <div className="mt-2">
              <img
                src={thumbPreview}
                alt="Thumbnail preview"
                className="max-w-xs h-auto"
              />
            </div>
          )}
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
