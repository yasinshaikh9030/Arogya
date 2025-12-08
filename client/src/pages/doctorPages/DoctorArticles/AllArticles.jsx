import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import axios from 'axios';
import {
    Calendar,
    Eye,
    Heart,
    MessageCircle,
    Bookmark,
    Pin,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    User,
    Stethoscope,
    GraduationCap,
    MapPin,
    AlertTriangle,
    Megaphone,
    FileText
} from 'lucide-react';
import PostCard from "../../../components/Doctor/PostCard";
import { auth } from '../../../config/config';

const AllArticles = () => {
    const [articles, setArticles] = useState([]);
    const [typeFilter, setTypeFilter] = useState('All');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();

    useEffect(() => {
        if (user?.uid) {
            fetchAllArticles();
        }
    }, [user]);

    console.log(user);

    const fetchAllArticles = async () => {
        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();
            console.log(token); 
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/articles/all`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(response);
            if (response.data.success) {
                setArticles(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching articles:', err);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'published':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'draft':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'review':
                return <AlertCircle className="w-4 h-4 text-blue-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'published':
                return 'Published';
            case 'draft':
                return 'Draft';
            case 'review':
                return 'Under Review';
            case 'rejected':
                return 'Rejected';
            default:
                return 'Unknown';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const truncateContent = (content, maxLength = 200) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const filteredArticles = typeFilter === 'All' ? articles : articles.filter(a => a.type === typeFilter);

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-light-surface dark:bg-dark-bg rounded-lg p-6 shadow-sm">
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
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Error Loading Articles
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={fetchAllArticles}
                            className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-light-primary-text dark:text-dark-primary-text mb-2">
                        Community
                    </h1>
                    <p className="text-light-secondary-text dark:text-dark-secondary-text">
                        Discover posts from medical professionals around the platform
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {['All', 'Article', 'Alert', 'Announcement'].map(k => (
                            <button
                                key={k}
                                onClick={() => setTypeFilter(k)}
                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                    typeFilter === k
                                        ? 'bg-light-primary dark:bg-dark-primary text-white border-transparent'
                                        : 'bg-transparent text-light-primary-text dark:text-dark-primary-text border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-surface'
                                }`}
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Posts Grid with Type Filter */}
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                        <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            No Posts Available
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            There are currently no posts from other doctors to display
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredArticles.map((article) => (
                            <PostCard key={article._id} post={article} showAuthor={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllArticles;