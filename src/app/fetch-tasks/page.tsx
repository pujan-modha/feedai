"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  feed_url: string;
  status: string;
  articles_count: number;
  created_at: string;
}

export default function FetchTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch("/api/fetch-tasks");
      const data = await response.json();
      setTasks(data);
    };
    fetchTasks();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Feed URL</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Articles Count</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b">
              <td className="border px-4 py-2">{task.feed_url}</td>
              <td className="border px-4 py-2">
                <Badge>{task.status}</Badge>
              </td>
              <td className="border px-4 py-2">{task.articles_count}</td>
              <td className="border px-4 py-2">
                {new Date(task.created_at).toLocaleTimeString()}{" "}-{" "}
                {new Date(task.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
