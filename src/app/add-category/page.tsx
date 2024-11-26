"use client";

import { useState , useEffect} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddCategory() {
  const [category, setCategory] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [successCategoryMessage, setSuccessCategoryMessage] = useState("");
  const [websites, setWebsites] = useState<Website[]>([]);
  const [successBulkCategoryMessage, setSuccessBulkCategoryMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

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
    setSubCategories(subCategories)
    const slugged_category = category.trim().toLowerCase().replaceAll(" ", "-");
    setCategorySlug(slugged_category);
  };

  return (
    <>
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
      </div>
      {/* <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Add Bulk Category</h1>
        {successBulkCategoryMessage && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-700">{successBulkCategoryMessage}</p>
          </div>
        )}
        <form className="space-y-4">
          <div>
            <Label htmlFor="categories">Select Category</Label>
            <Input id="categories" placeholder="" required />
          </div>
          <div>
            <Label htmlFor="name">Select Websites</Label>
            <Input id="name" placeholder="" required />
          </div>
          <Button type="submit">Add Website</Button>
        </form>
      </div> */}
      <div className="flex flex-col mt-12">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
                      slug
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
                      Subcategories
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
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {category.slug}
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
                              {category.value}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.created_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <Button
                          variant={"destructive"}
                          // onClick={() => handleDelete(category.id)}
                        >
                          Delete
                        </Button>
                        <Button
                        variant={"outline"}
                        // onClick={() => handleDelete(category.id)}
                        >
                          Edit
                        </Button>
                        <Button
                        // onClick={() => handleDelete(category.id)}
                        >
                          View Feeds
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
