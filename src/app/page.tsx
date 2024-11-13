"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function ArticleDisplay({ article }: { article: Article }) {
  // Split the content into article body and metadata
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

export default function Home() {
  const [feedUrl, setFeedUrl] = useState("https://chopaltv.com/feed.xml");
  const [numArticles, setNumArticles] = useState(1);
  const [language, setLanguage] = useState(["English"]);
  const [temperature, setTemperature] = useState(0.5);
  const [generatedArticles, setGeneratedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedUrl, numArticles, language, temperature }),
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">FeedAI</h1>
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
        </div>
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
        <div className="flex gap-4">
          {Array.from({ length: numArticles }).map((_, index) => (
            <div key={index} className="grid w-full">
              <Label htmlFor={`language-${index}`} className="mb-1">
                Language {index + 1}
              </Label>
              <Select
                defaultValue={language[index] || "English"}
                onValueChange={(val) => {
                  const newLanguages = [...language];
                  newLanguages[index] = val;
                  setLanguage(newLanguages);
                }}
              >
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {/* <div className="space-y-1">
          <Label htmlFor="temperature">Temperature ({temperature})</Label>
          <Slider
            defaultValue={[0.5]}
            max={1}
            step={0.01}
            className="w-full"
            onValueChange={(val) => setTemperature(val[0])}
          />
        </div> */}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Generating..." : "Generate Articles"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
