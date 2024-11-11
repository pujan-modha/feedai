"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Article {
  title: string;
  content: string;
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  summary: string;
  primaryCategory: string;
  secondaryCategory: string;
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
      </CardHeader>
      <CardContent>
        <div
          className="prose max-w-none"
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
  const [feedUrl, setFeedUrl] = useState("");
  const [numArticles, setNumArticles] = useState(1);
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
        body: JSON.stringify({ feedUrl, numArticles }),
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
      <h1 className="text-2xl font-bold mb-4">RSS Article Generator</h1>
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
          <Input
            id="numArticles"
            type="number"
            min="1"
            max="10"
            value={numArticles}
            onChange={(e) => setNumArticles(parseInt(e.target.value))}
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
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
          {generatedArticles.map((article, index) => (
            <ArticleDisplay key={index} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
