"use client";

import { useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Article {
  title: string;
  content: string;
  heading: string;
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  summary: string;
  primaryCategory: string;
  secondaryCategory: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface XMLAttributes {
  title: string;
  guid: string;
  link: string;
  thumbnailimage: string;
  description: string;
  category: string;
  author: string;
  pubDate: string;
  lastModified: string;
  summary: string;
  content: string;
}

export default function FetchArticle() {
  const [feedUrl, setFeedUrl] = useState("https://chopaltv.com/feed.xml");
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);
  const [xmlAttributes, setXmlAttributes] = useState<XMLAttributes>({
    "title": "",
    "guid": "",
    "link": "",
    "thumbnailimage": "",
    description: "",
    category: "",
    author: "",
    pubDate: "",
    lastModified: "",
    summary: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );

  const fields = [
    "Article Title",
    "Article GUID",
    "Article URL",
    "Thumbnail Image",
    "Article Description",
    "Article Category",
    "Article Author",
    "Article Creation Date",
    "Article Last Modified Date",
    "Article Summary",
    "Content Encoded",
  ];

  const fieldToAttributeMap: Record<string, keyof XMLAttributes> = {
    "Article Title": "title",
    "Article GUID": "guid",
    "Article URL": "link",
    "Thumbnail Image": "thumbnailimage",
    "Article Description": "description",
    "Article Category": "category",
    "Article Author": "author",
    "Article Creation Date": "pubDate",
    "Article Last Modified Date": "lastModified",
    "Article Summary": "summary",
    "Content Encoded": "content",
  };

  const sanitizeHtml = (html: string): string => {
    // Basic HTML sanitization
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return dateStr;
    }
  };

  const getFieldValues = (): string[] => {
    if (latestArticle) {
      const values = Object.values(latestArticle).filter(
        (value): value is string =>
          typeof value === "string" && value.trim() !== ""
      );
      return Array.from(new Set(values));
    }
    return [];
  };

  const handleFieldMapping = (field: string, value: string) => {
    const attributeKey = fieldToAttributeMap[field];
    if (attributeKey) {
      const sanitizedValue =
        attributeKey === "content" ? sanitizeHtml(value) : value;
      setXmlAttributes((prev) => ({
        ...prev,
        [attributeKey]: sanitizedValue,
      }));

      setFieldMappings((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/parse-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rss_article_link: feedUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch articles");
      }

      setLatestArticle(data);
      console.log("Parsed Data:", data);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (!xmlAttributes.guid || !xmlAttributes.title) {
        throw new Error("Title and GUID are required fields");
      }

      const sanitizedData = {
        guid: xmlAttributes.guid,
        title: xmlAttributes.title,
        description: xmlAttributes.description,
        link: xmlAttributes.link,
        thumbnail_image: xmlAttributes.thumbnailimage,
        category: xmlAttributes.category,
        author: xmlAttributes.author,
        published_at: formatDate(xmlAttributes.pubDate),
        summary: xmlAttributes.summary,
        content_encoded: sanitizeHtml(xmlAttributes.content),
      };

      const response = await fetch("/api/save-rss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save article");
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving article:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save article"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">FeedAI</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="mb-4">
          <AlertDescription>Article saved successfully!</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="feedUrl">RSS Feed URL</Label>
          <Input
            id="feedUrl"
            type="url"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            required
          />
          <Button className="w-full mt-2" type="submit" disabled={isLoading}>
            {isLoading ? "Fetching..." : "Fetch Feed"}
          </Button>
        </div>
      </form>

      <div className="container mx-auto p-6 px-0">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">
              MAP &lt;item&gt; Tag Fields
            </h2>
            <div className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field}
                  className="grid grid-cols-[250px_1fr] items-center gap-4"
                >
                  <label className="text-sm font-medium leading-none">
                    {field}
                  </label>
                  <Select
                    onValueChange={(value) => handleFieldMapping(field, value)}
                  >
                    <SelectTrigger className="max-w-[40vw]">
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFieldValues().map((value, index) => (
                        <SelectItem key={`${value}-${index}`} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">RSS FEED Preview</h2>
            <Card className="p-4 h-[400px] overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(xmlAttributes, null, 2)}
              </pre>
            </Card>
          </div>
        </div>
      </div>

      <Button
        className="w-full mt-4"
        onClick={handleSave}
        disabled={isSaving || !xmlAttributes.guid || !xmlAttributes.title}
      >
        {isSaving ? "Saving..." : "Save Article"}
      </Button>
    </div>
  );
}
