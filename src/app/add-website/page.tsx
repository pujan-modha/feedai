"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Language {
  id: string;
  name: string;
}

export default function AddWebsite() {
  const [name, setName] = useState("chatgpt");
  const [url, setUrl] = useState("http://localhost:3000/add-website");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchLanguages();
  }, []);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/add-category");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      console.log(data);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    }
  };

  useEffect(() => {
    console.log(selectedCategories);
  }, [selectedCategories]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const joined_categories = selectedCategories.join(",");
      const joined_languages = selectedLanguages.join(",");
      console.log(joined_categories, joined_languages);
      const res = await fetch("/api/add-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          url: url,
          languages: joined_languages,
          categories: joined_categories,
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
      setSelectedCategories([]);
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
          <Label htmlFor="languages">Languages</Label>
          <div className="flex flex-wrap gap-4">
            {languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedLanguages.includes(lang.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLanguages((prev) =>
                        prev.includes(lang.name) ? prev : [...prev, lang.name]
                      );
                    } else {
                      setSelectedLanguages((prev) =>
                        prev.filter((lng) => lng !== lang.name)
                      );
                    }
                  }}
                />

                {lang.name}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
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
        </div>
        <Button type="submit">Add Website</Button>
      </form>
    </div>
  );
}
