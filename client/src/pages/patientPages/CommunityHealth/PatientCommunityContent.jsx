import React, { useEffect, useState } from "react";
import { useUser } from '../../../context/UserContext';
import axios from "axios";
import PostCard from "../../../components/Doctor/PostCard";
import { Stethoscope, XCircle } from "lucide-react";
import { auth } from "../../../config/config";

export default function PatientCommunityContent() {
    const { user } = useUser();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState("All");

    useEffect(() => {
        if (user?.uid) fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();
            console.log("=====");
            const res = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/articles/all`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log(res);
            if (res.data.success) setPosts(res.data.data);
        } catch (err) {
            console.error("Failed to load community posts", err);
            setError("Failed to load posts");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="bg-light-surface dark:bg-dark-bg rounded-lg p-6 shadow-sm">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto text-center py-12">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Error Loading Posts
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {error}
                    </p>
                    <button
                        onClick={fetchPosts}
                        className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const filtered =
        typeFilter === "All"
            ? posts
            : posts.filter((p) => p.type === typeFilter);

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-light-primary-text dark:text-dark-primary-text mb-2">
                        Community Health
                    </h1>
                    <p className="text-light-secondary-text dark:text-dark-secondary-text">
                        Read posts and updates from doctors across the community
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {["All", "Article", "Alert", "Announcement"].map(
                            (k) => (
                                <button
                                    key={k}
                                    onClick={() => setTypeFilter(k)}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                        typeFilter === k
                                            ? "bg-light-primary dark:bg-dark-primary text-white border-transparent"
                                            : "bg-transparent text-light-primary-text dark:text-dark-primary-text border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-surface"
                                    }`}>
                                    {k}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            No Posts Available
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            There are currently no posts to display
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                showAuthor={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
