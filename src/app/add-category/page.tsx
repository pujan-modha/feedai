"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddCategory() {
  const [category, setCategory] = useState<string>("Politics");
  const [categorySlug, setCategorySlug] = useState<string>("politics");
  const [successCategoryMessage, setSuccessCategoryMessage] = useState("");
  const [successBulkCategoryMessage, setSuccessBulkCategoryMessage] = useState("");

  const handleSubmitCategory = async (e: React.FormEvent<HTMLFormElement>) => {
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
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to add category");
      }
      setSuccessCategoryMessage("Category added successfully");
    } catch (error) {
      console.error("Error adding website:", error);
    }
  };

  const handleCategory = (category: string) => {
    setCategory(category);
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
              placeholder=""
              required
            />
          </div>
          <div>
            <Label htmlFor="category-slug">Category Slug</Label>
            <Input
              id="category-slug"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder=""
              required
            />
          </div>
          <Button type="submit">Add Website</Button>
        </form>
      </div>
      <div className="container mx-auto p-4">
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
      </div>
    </>
  );
}
