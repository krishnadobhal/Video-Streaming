"use client";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { redirect, useRouter } from "next/navigation";
import { Search } from "lucide-react";

const SearchBar = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const handleSearch = async () => {
            if (!searchTerm) return;
            // TODO: Implement search functionality
        };
        handleSearch();
    }, [searchTerm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/results?search_query=${searchTerm}`);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto relative"
        >
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
            </div>
        </form>
    );
};

export default SearchBar;
