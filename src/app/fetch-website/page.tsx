"use client";

import { useEffect, useState } from "react";
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
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Website {
  id: string;
  name: string;
  url: string;
  languages: string;
  categories: string;
}

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

export default function FeedAI() {
  const [feedUrl, setFeedUrl] = useState("https://chopaltv.com/feed.xml");
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);
  const [xmlAttributes, setXmlAttributes] = useState<XMLAttributes>({
    title: "",
    guid: "",
    link: "",
    thumbnailimage: "",
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
  const [hasSaved, setHasSaved] = useState(false);
  const [numArticles, setNumArticles] = useState(1);
  const [website, setWebsite] = useState<Website[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<
    Record<string, Website | null>
  >({});
  const [selectedLanguages, setSelectedLanguages] = useState<
    Record<string, string>
  >({});
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string[]>
  >({});
  const [cronTiming, setCronTiming] = useState<string>("1");
  const [userprompt, setUserPrompt] =
    useState(`Rewrite the input article while retaining all factual information. Do not alter any facts.
The output article should appear as if written by a human, not a machine.
The length of the rewritten article should be between 400 and 1500 words.
Add proper headings and subheadings with H1, H2, and H3 tags according to Google News standards.
SEO Optimization:

Create an SEO-friendly title for the article that is catchy and includes appropriate keywords. For Hindi articles, you can incorporate English keywords into the title.
Remove any mentions of media houses or agencies (e.g., IANS, ANI, PTI, Hindusthan Samachar). Replace any specific agency or news website names inside the content with a generic term.
Generate an SEO-optimized meta title, meta description, and meta keywords.
Summary Creation:

Write a 160-word summary that provides a general overview and generates curiosity to encourage readers to view the full article.
Output Variations:

If an input parameter specifies multiple versions (e.g., 3 versions), generate that many unique, plagiarism-free versions of the rewritten article. Each version should differ from the others in terms of wording, while still meeting all other requirements.
Category Assignment:

Assign categories to the article based on the specified website where it will be published. A list of pre-defined categories will be provided as input.
Highlight the primary and secondary categories according to the content.
Content Clean-up:

Remove any scripts, duplicate media, or irrelevant content from the input article.
Additional Guidelines:

Ensure all output articles are SEO-friendly and adhere to Google News and search guidelines.
  `);
  const [generatedArticles, setGeneratedArticles] = useState<Article[]>([]);

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
      const values = Object.keys(latestArticle).filter(
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
    }
  };

  const handleFetchFeed = async (e: React.FormEvent) => {
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
      setHasSaved(true);
    } catch (error) {
      console.error("Error saving article:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save article"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateArticles = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedUrl: feedUrl,
          numArticles: numArticles,
          language: selectedLanguages,
          website_categories: selectedCategories,
          userPrompt: userprompt,
          temperature: 0.5,
          cron_timing: cronTiming,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate articles");
      }

      setGeneratedArticles(data.articles);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchWebsites = async () => {
    try {
      const response = await fetch("/api/add-website");
      if (!response.ok) {
        throw new Error("Failed to fetch websites");
      }
      const data: Website[] = await response.json();
      console.log(data);
      setWebsite(data);

      const initialSelectedWebsites: Record<string, Website> = {};
      const initialSelectedLanguages: Record<string, string> = {};
      const initialSelectedCategories: Record<string, string[]> = {};

      Array.from({ length: 3 }).forEach((_, index) => {
        const key = `website_${index + 1}`;
        initialSelectedWebsites[key] = data[0];
        initialSelectedLanguages[key] = data[0].languages.split(",")[0].trim();
        initialSelectedCategories[key] = data[0].categories
          .split(",")
          .map((cat) => cat.trim());
      });

      setSelectedWebsites(initialSelectedWebsites);
      setSelectedLanguages(initialSelectedLanguages);
      setSelectedCategories(initialSelectedCategories);
    } catch (error) {
      console.error("Error fetching websites:", error);
      setError("Failed to fetch websites");
    }
  };

  useEffect(() => {
    handleFetchWebsites();
  }, []);

  // useEffect(() => {
  //   console.log("Selected Websites:", selectedWebsites);
  //   console.log("Selected Languages:", selectedLanguages);
  //   console.log("Selected Categories:", selectedCategories);
  // }, [selectedWebsites, selectedLanguages, selectedCategories]);

  const handleWebsiteChange = (websiteKey: string, selectedUrl: string) => {
    const selectedSite = website.find((site) => site.url === selectedUrl);
    if (selectedSite) {
      setSelectedWebsites((prev) => ({
        ...prev,
        [websiteKey]: selectedSite,
      }));

      setSelectedLanguages((prev) => ({
        ...prev,
        [websiteKey]: selectedSite.languages.split(",")[0].trim(),
      }));

      setSelectedCategories((prev) => ({
        ...prev,
        [websiteKey]: selectedSite.categories
          .split(",")
          .map((cat) => cat.trim()),
      }));
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

      <form onSubmit={handleFetchFeed} className="space-y-4">
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
                    onValueChange={(value) => {
                      if (latestArticle && value in latestArticle) {
                        handleFieldMapping(
                          field,
                          (latestArticle as Article)[
                            value as keyof Article
                          ] as string
                        );
                      }
                    }}
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

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Generate Articles</h2>
        <form onSubmit={handleGenerateArticles} className="space-y-4">
          <div>
            <Label htmlFor="numArticles">Number of Articles</Label>
            <Select
              defaultValue={numArticles.toString()}
              onValueChange={(val) => setNumArticles(parseInt(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select number of articles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {Array.from({ length: numArticles }).map((_, index) => (
            <div key={index} className="flex items-center gap-2 justify-center">
              <div className="grid w-full">
                <Label htmlFor={`website-${index}`} className="mb-1">
                  Website {index + 1}
                </Label>
                <Select
                  value={selectedWebsites[`website_${index + 1}`]?.url}
                  onValueChange={(val) =>
                    handleWebsiteChange(`website_${index + 1}`, val)
                  }
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Select a website" />
                  </SelectTrigger>
                  <SelectContent>
                    {website.map((site) => (
                      <SelectItem key={site.id} value={site.url}>
                        {site.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full">
                <Label htmlFor={`language-${index}`} className="mb-1">
                  Language {index + 1}
                </Label>
                <Select
                  value={selectedLanguages[`website_${index + 1}`]}
                  onValueChange={(val) => {
                    setSelectedLanguages((prev) => ({
                      ...prev,
                      [`website_${index + 1}`]: val,
                    }));
                  }}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedWebsites[`website_${index + 1}`]?.languages
                      .split(",")
                      .map((lang: string) => (
                        <SelectItem key={lang.trim()} value={lang.trim()}>
                          {lang.trim()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full">
                <Label htmlFor={`categories-${index}`} className="mb-1">
                  Categories {index + 1}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories[`website_${index + 1}`]?.map(
                    (category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="capitalize"
                      >
                        {category}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          <div>
            <Label htmlFor="prompt">Input prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here"
              value={userprompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="cron">Cron Timing</Label>
            <Select
              defaultValue={cronTiming}
              onValueChange={(val) => setCronTiming(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Cron timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Generating..." : "Generate Articles"}
          </Button>
        </form>
      </div>

      {generatedArticles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Articles</h2>
          <div className="lg:flex gap-4">
            {generatedArticles.map((article, index) => (
              <ArticleDisplay key={index} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleDisplay({ article }: { article: Article }) {
  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <div className="flex space-x-2 mt-2">
          <Badge variant="default">{article.primaryCategory}</Badge>
          <Badge variant="outline">{article.secondaryCategory}</Badge>
        </div>
        <div className="flex-col mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span className="font-semibold">Prompt Tokens:</span>
            <span>{article.prompt_tokens}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold">Completion Tokens:</span>
            <span>{article.completion_tokens}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold">Total Tokens:</span>
            <span>{article.total_tokens}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="prose max-w-none mb-8 bg-gray-200 p-4 rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <div className="mt-8 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">SEO-Friendly Title</h3>
            <p>{article.seoTitle}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Meta Information</h3>
            <ul className="list-disc pl-5">
              <li>
                <strong>Title:</strong> {article.metaTitle}
              </li>
              <li>
                <strong>Description:</strong> {article.metaDescription}
              </li>
              <li>
                <strong>Keywords:</strong> {article.metaKeywords.join(", ")}
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
  );
}
