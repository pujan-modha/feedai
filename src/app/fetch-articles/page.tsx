"use client";

import { useEffect, useState } from "react";

interface Article {
  id: string;
  task_id: number;
  title: string;
  created_at: string;
  primary_category: string;
  secondary_category: string;
}

export default function FetchArticles() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const response = await fetch("/api/fetch-articles");
      const data = await response.json();
      setArticles(data);
    };
    fetchArticles();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Task ID</th>
            <th className="border px-4 py-2">Title</th>
            <th className="border px-4 py-2">Created At</th>
            <th className="border px-4 py-2">Primary Category</th>
            <th className="border px-4 py-2">Secondary Category</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id} className="border-b">
              <td className="border px-4 py-2">{article.task_id}</td>
              <td className="border px-4 py-2">{article.title}</td>
              <td className="border px-4 py-2">
                {article.created_at
                  ? new Date(article.created_at).toLocaleDateString()
                  : "-"}
              </td>
              <td className="border px-4 py-2">{article.primary_category}</td>
              <td className="border px-4 py-2">{article.secondary_category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
