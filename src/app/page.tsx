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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  seo_title: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  summary: string;
  primary_category: string;
  secondary_category: string;
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
  // category: string;
  author: string;
  pubDate: string;
  // lastModified: string;
  summary: string;
  content: string;
}

export default function FeedAI() {
  const { toast } = useToast();
  const [feedUrl, setFeedUrl] = useState("https://chopaltv.com/feed.xml");
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);
  const [articleCount, setArticleCount] = useState(0);
  const [xmlAttributes, setXmlAttributes] = useState<XMLAttributes>({
    title: "",
    guid: "",
    link: "",
    thumbnailimage: "",
    description: "",
    author: "",
    pubDate: "",
    summary: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState({
    fetchFeed: false,
    generatePreview: false,
    saveFeed: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [haspreviewed, setHasPreviewed] = useState(false);
  const [numArticles, setNumArticles] = useState(1);
  const [website, setWebsite] = useState<Website[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<
    Record<string, Website | null>
  >({});
  const [selectedLanguages, setSelectedLanguages] = useState<
    Record<string, string>
  >({});

  const [userprompt, setUserPrompt] = useState(
    `Rewrite the input article while retaining all factual information without altering any facts.
The output must be in language specified by the user.
The output article should appear as if written by a human, not a machine.
The length of the rewritten article should be between 400 and 1500 words.
Add proper headings and subheadings with H1, H2, and H3 tags according to Google News standards.

SEO Optimization:
Create an SEO-friendly title for the article that is catchy and includes appropriate keywords.
Remove any mentions of media houses or agencies (e.g., IANS, ANI, PTI, Hindusthan Samachar).
Replace any specific agency or news website names inside the content with a generic term.
Generate an SEO-optimized meta title, meta description, and meta keywords.

Summary Creation:
Write a 160-word summary that provides a general overview and generates curiosity to encourage readers to view the full article.

Category Assignment:
Assign categories to the article based on the specified website where it will be published.
A list of pre-defined categories will be provided as input.
Highlight the primary and secondary categories according to the content.

Additional Guidelines:
Ensure all output articles are SEO-friendly and adhere to Google News and search guidelines.`
  );
  const [generatedArticles, setGeneratedArticles] = useState<Article[]>([]);
  const [task_config, setTaskConfig] = useState({});

  const fields = [
    "Article Title",
    "Article GUID",
    "Article URL",
    "Thumbnail Image",
    "Article Description",
    // "Article Category",
    "Article Author",
    "Article Creation Date",
    // "Article Last Modified Date",
    "Article Summary",
    "Article Content",
  ];

  const fieldToAttributeMap: Record<string, keyof XMLAttributes> = {
    "Article Title": "title",
    "Article GUID": "guid",
    "Article URL": "link",
    "Thumbnail Image": "thumbnailimage",
    "Article Description": "description",
    // "Article Category": "category",
    "Article Author": "author",
    "Article Creation Date": "pubDate",
    // "Article Last Modified Date": "lastModified",
    "Article Summary": "summary",
    "Article Content": "content",
  };

  const sanitizeHtml = (html: string): string => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
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
    // Check if all fields have been filled in xmlatteibutes
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
    setIsLoading({ ...isLoading, fetchFeed: true });
    setError(null);
    setSaveSuccess(false);
    console.log(feedUrl);
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

      setLatestArticle(data.article_feed);
      setArticleCount(data.feed_length);
      console.log("Parsed Data:", data);
      toast({
        title: "Feed fetched sucessfuly!",
        description: feedUrl,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong!",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading({ ...isLoading, fetchFeed: false });
    }
  };

  const handleSaveFeed = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setError(null);
      setSaveSuccess(false);
      setIsLoading({ ...isLoading, saveFeed: true });
      const task_obj = {
        article_count: articleCount,
        feed_url: feedUrl,
        feed_items: xmlAttributes,
        feed_config: task_config,
      };
      console.log(task_obj);
      const res = await fetch("/api/save-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_obj }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setSaveSuccess(true);
      toast({
        title: "Feed imported successfully!",
        description: "Feed articles have been imported and saved",
      });
      handleReset()
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong!",
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading({ ...isLoading, saveFeed: false });
    }
  };

  const handleGenerateArticles = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading({ ...isLoading, generatePreview: true });
    setHasPreviewed(false);
    setError(null);

    try {
      const task_obj = {
        feed_url: feedUrl,
        feed_items: xmlAttributes,
        feed_config: task_config,
      };
      console.log(task_obj);
      const response = await fetch("/api/generate-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task_obj),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate articles");
      }
      console.log(data.preview_result_articles_arr);
      setGeneratedArticles(data.preview_result_articles_arr);
      setHasPreviewed(true);
      toast({
        title: "Preview generated successfully!",
        description: "Preview articles are ready to be imported",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong!",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading({ ...isLoading, generatePreview: false });
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
    } catch (error) {
      console.error("Error fetching websites:", error);
      setError("Failed to fetch websites");
    }
  };

  const handleReset = () => {
    setHasFetched(false);
    setHasPreviewed(false);
    setIsLoading({ fetchFeed: false, generatePreview: false, saveFeed: false });
    setError(null);
    setSaveSuccess(false);
    setTaskConfig({});
    setGeneratedArticles([]);
    setSelectedWebsites({});
    setSelectedLanguages({});
    setArticleCount(1);
    setFeedUrl("");
  };

  useEffect(() => {
    handleFetchWebsites();
  }, []);

  useEffect(() => {
    if (
      Object.values(xmlAttributes).filter((val) => val.trim() !== "").length ===
      fields.length
    ) {
      setHasFetched(true);
    }
  }, [xmlAttributes]);

  useEffect(() => {
    setTaskConfig({
      num_articles: numArticles,
      selected_websites: Object.values(selectedWebsites).slice(0, numArticles),
      selected_languages: Object.values(selectedLanguages).slice(
        0,
        numArticles
      ),
      userprompt: userprompt,
    });
  }, [numArticles, selectedWebsites, selectedLanguages, userprompt]);

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
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">FeedAI</h1>
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
          <Button
            className="w-full mt-2"
            type="submit"
            disabled={isLoading["fetchFeed"]}
          >
            {isLoading["fetchFeed"] ? "Fetching..." : "Fetch Feed"}
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
                        handleFieldMapping(field, value);
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

      {/* <Button
        className="w-full mt-4"
        onClick={handleSave}
        disabled={isSaving || !xmlAttributes.guid || !xmlAttributes.title}
      >
        {isSaving ? "Saving..." : "Save Article"}
      </Button> */}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Generate Articles</h2>
        <form onSubmit={handleGenerateArticles} className="space-y-4">
          <div>
            <Label htmlFor="numArticles">Number of Versions</Label>
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
                  defaultValue={selectedWebsites[
                    `website_${index + 1}`
                  ]?.languages
                    .split(",")[0]
                    .trim()}
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
            </div>
          ))}

          <div>
            <Label htmlFor="prompt">Input prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here"
              value={userprompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full h-64"
            />
          </div>
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!hasFetched || isLoading["generatePreview"]}
              className="w-full"
            >
              {isLoading["generatePreview"]
                ? "Generating..."
                : "Generate Preview"}
            </Button>
          </div>
        </form>
      </div>

      {generatedArticles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Versions</h2>
          <div className="lg:flex gap-4">
            {generatedArticles.map((article, index) => (
              <ArticleDisplay key={index} article={article} />
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={handleSaveFeed}
        className={cn("w-full mt-8", {
          hidden: !haspreviewed,
        })}
        disabled={!haspreviewed || isLoading["saveFeed"]}
      >
        {isLoading["saveFeed"] ? "Importing..." : "Start Importing"}
      </Button>
    </div>
  );
}

function ArticleDisplay({ article }: { article: Article }) {
  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <div className="flex space-x-2 mt-2">
          <Badge variant="default">{article.primary_category}</Badge>
          <Badge variant="outline">{article.secondary_category}</Badge>
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
            <p>{article.seo_title}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Meta Information</h3>
            <ul className="list-disc pl-5">
              <li>
                <strong>Title:</strong> {article.meta_title}
              </li>
              <li>
                <strong>Description:</strong> {article.meta_description}
              </li>
              <li>
                <strong>Keywords:</strong> {article.meta_keywords.join(", ")}
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
