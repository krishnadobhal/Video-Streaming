"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import axios, { CancelTokenSource } from "axios";
import { set } from "video.js/dist/types/tech/middleware";

const SearchBar = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // To avoid recreating the function on every render
    const fetchSuggestions = useCallback(async (query: string, cancelToken: CancelTokenSource) => {
        try {
            const res = await axios.get(`http://localhost:8082/watch/suggest`, {
                params: { query },
                cancelToken: cancelToken.token,
            });
            setSuggestions(res.data);
            console.log("Search suggestions:", res.data);
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch suggestions", err);
        }
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setSuggestions([]);
            return;
        }

        const DEBOUNCE_MS = 400;
        // Cancel token to cancel previous requests
        const cancelToken = axios.CancelToken.source();

        const handler = setTimeout(() => {
            fetchSuggestions(searchTerm, cancelToken);
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(handler);
            cancelToken.cancel();
        };
    }, [searchTerm, fetchSuggestions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setSuggestions([]);
        setSearchTerm("");
        router.push(`/results?search_query=${searchTerm}`);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative">
            <div className="flex items-center space-x-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-full px-4 py-2 shadow-sm focus-within:shadow-md transition">
                <Search className="w-5 h-5 text-neutral-500" />
                <Input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 focus-visible:outline-none bg-transparent text-sm"
                />
                <button
                    type="submit"
                    className="hidden sm:block bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-4 py-1 rounded-full text-sm transition"
                >
                    Search
                </button>

                {suggestions.length > 0 && (
                    <div
                        role="listbox"
                        className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md mt-1 z-10 shadow-lg"
                    >
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                role="option"
                                onClick={() => {
                                    setSearchTerm(suggestion);
                                    router.push(`/results?search_query=${suggestion}`);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </form>
    );
};

export default SearchBar;