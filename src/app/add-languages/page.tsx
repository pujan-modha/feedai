"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddLanguage() {
  const [language, setLanguage] = useState<string>("English");
  const [successLanguageMessage, setSuccessLanguageMessage] = useState("");
  const [successBulkLanguageMessage, setSuccessBulkLanguageMessage] =
    useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!language) return;
      const res = await fetch("/api/add-language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: language,
        }),
      });
      console.log(res);
      if (!res.ok) {
        const error = await res.json();
        console.error("Error adding website:", error);
        return;
      }

      setSuccessLanguageMessage("Website added successfully");
    } catch (error) {
      console.error("Error adding website:", error);
    }
  };

  useEffect(() => {
    if (language === "") setSuccessLanguageMessage(null);
  }, [language]);

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Add Language</h1>
        {successLanguageMessage && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-700">{successLanguageMessage}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Enter Langauge"
              required
            />
          </div>
          <Button type="submit">Add Language</Button>
        </form>
      </div>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Add Bulk Language</h1>
        {successBulkLanguageMessage && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-700">{successBulkLanguageMessage}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bulk-language">Select Language</Label>
            <Input id="" placeholder="" required />
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
