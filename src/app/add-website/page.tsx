"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddWebsite() {
  const [name, setName] = useState("chatgpt");
  const [url, setUrl] = useState("http://localhost:3000/add-website");
  const [languages, setLanguages] = useState<string>("English, Hindi");
  const [categories, setCategories] = useState<string>("Politics, Sports");
  // Add state for success message
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      console.log({
        name,
        url,
        languages,
        categories,
      });
      const res = await fetch("/api/add-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          languages,
          categories,
        }),
      });
      console.log(res);
      if (!res.ok) {
        const error = await res.json();
        console.error("Error adding website:", error);
        return;
      }
      setName("");
      setUrl("");
      setLanguages("");
      setCategories("");
      setSuccessMessage("Website added successfully");
    } catch (error) {
      console.error("Error adding website:", error);
    }
  };

  const handleLanguage = (comma_languages: string) => {
    // const languages_arr = comma_languages
    //   .split(",")
    //   .map((language) => language.trim());

    setLanguages(comma_languages);
  };

  const handleCategories = (comma_categories: string) => {
    // const categories_arr = comma_categories
    //   .split(",")
    //   .map((category) => category.trim());
    setCategories(comma_categories);
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
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="categories">Categories</Label>
          <Input
            id="categories"
            value={categories}
            onChange={(e) => handleCategories(e.target.value)}
            placeholder="Politics, Sports, Entertainment"
            required
          />
        </div>

        <div>
          <Label htmlFor="languages">Languages</Label>
          <Input
            id="languages"
            value={languages}
            onChange={(e) => handleLanguage(e.target.value)}
            placeholder="English, Gujurati, Marathi"
            required
          />
        </div>
        <Button type="submit">Add Website</Button>
      </form>
    </div>
  );
}
