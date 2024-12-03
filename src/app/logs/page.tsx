'use client';
import React, { useEffect, useState } from 'react';

interface Log {
    id: string;
    message: string;
    category: string;
    created_at: string;
}

export default function Logs() {
    const [data, setData] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/fetch-logs');
                const result = await response.json();
                console.log(result);
                setData(result.data);
                setIsLoading(false);
            } catch (err) {
                setError(err as Error);
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error: Failed to load logs
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-4 text-gray-500">
                Loading...
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Logs</h1>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b text-left">Message</th>
                        <th className="py-2 px-4 border-b text-left">Category</th>
                        <th className="py-2 px-4 border-b text-left">Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{log.message}</td>
                            <td className="py-2 px-4 border-b">{log.category}</td>
                            <td className="py-2 px-4 border-b">
                                {new Date(log.created_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
