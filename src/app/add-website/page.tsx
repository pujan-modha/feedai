"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Languages } from "@/lib/constants";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// interface Category {
//   id: string;
//   name: string;
//   slug: string;
// }

interface Language {
  id: string;
  name: string;
}

interface Website {
  id: string;
  name: string;
  url: string;
  slug: string;
  // categories: string;
  languages: string;
  created_at: string;
  modified_at: string;
  author: string;
  description: string;
  thumb: string;
}

export default function AddWebsite() {
  const [name, setName] = useState("Example");
  const [url, setUrl] = useState("https://example.com/feed.xml");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [slug, setSlug] = useState("example-hindi");
  const [desc, setDesc] = useState("Description goes here...");
  const [author, setAuthor] = useState("John Doe");
  const [thumb, setThumb] = useState("https://example.com/placeholder.svg");
  // const [categories, setCategories] = useState<Category[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  // const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);

  useEffect(() => {
    // fetchCategories();
    fetchLanguages();
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, []);

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

  // const fetchCategories = async () => {
  //   try {
  //     const response = await fetch("/api/add-category");
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch categories");
  //     }
  //     const data = await response.json();
  //     console.log(data);
  //     // setCategories(data);
  //   } catch (error) {
  //     console.error("Error fetching categories:", error);
  //     setError("Failed to fetch categories");
  //   }
  // };

  // useEffect(() => {
  //   console.log(selectedCategories);
  // }, [selectedCategories]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("Hello" + name, url, languages, slug);
    try {
      e.preventDefault();
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
          url: url,
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
      // setSelectedCategories([]);
      setSuccessMessage("Website added successfully");
    } catch (error) {
      console.error("Error adding website:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Website</h1>
      {successMessage && (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Website Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            required
          />
        </div>
        <div>
          <Label htmlFor="feed-url">Website Feed URL</Label>
          <Input
            id="feed-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com"
            required
          />
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
            type="url"
            value={thumb}
            onChange={(e) => setThumb(e.target.value)}
            placeholder="/placeholder.svg"
          />
        </div>
        <div>
          <Label htmlFor="languages">Languages</Label>
          <RadioGroup
            id="languages"
            className="flex flex-wrap gap-4"
            onValueChange={(value) => setSelectedLanguages([value])}
          >
            {Languages.map((lang, index) => (
              <div key={index} className="flex items-center gap-2">
                <RadioGroupItem value={lang} />
                {lang}
              </div>
            ))}
          </RadioGroup>
        </div>
        {/* <div className="space-y-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories((prev) =>
                        prev.includes(category.slug)
                          ? prev
                          : [...prev, category.slug]
                      );
                    } else {
                      setSelectedCategories((prev) =>
                        prev.filter((slg) => slg !== category.slug)
                      );
                    }
                  }}
                />
                {category.name}
              </div>
            ))}
          </div>
        </div> */}
        <Button type="submit">Add Website</Button>
      </form>
      <div className="flex flex-col mt-12">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-x-scroll">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="">
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      URL
                    </th>
                    {/* <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Categories
                    </th> */}
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Languages
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Slug
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Author
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {websites.map((website) => (
                    <tr key={website.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.categories
                                .split(",")
                                .map(
                                  (cat) =>
                                    cat
                                      .replace(/-/g, " ")
                                      .charAt(0)
                                      .toUpperCase() +
                                    cat.replace(/-/g, " ").slice(1)
                                )
                                .join(", ")}
                            </div>
                          </div>
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.languages}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.author}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {website.created_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <Button
                          className=""
                          variant={"destructive"}
                          onClick={() => handleDelete(website.id)}
                        >
                          Delete
                        </Button>
                        <Button className="">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
