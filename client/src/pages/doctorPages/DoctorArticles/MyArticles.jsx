import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import axios from 'axios';

import PostCard from '../../../components/Doctor/PostCard';
import { Edit3, XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { auth } from '../../../config/config';

const MyArticles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({ id: '', title: '', content: '', type: 'Article' });

    useEffect(() => {
        if (user?.uid) {
            fetchMyArticles();
        }
    }, [user]);

    const refresh = () => fetchMyArticles();

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Delete this post? This action cannot be undone.');
        if (!confirmed) return;
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/articles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refresh();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete the post.');
        }
    };

    const handleEdit = (article) => {
        setEditData({
            id: article._id,
            title: article.title || '',
            content: article.content || '',
            type: article.type || 'Article',
        });
        setIsEditOpen(true);
    };

    const submitEdit = async () => {
        try {
            setIsSaving(true);
            const allowed = ['Article', 'Announcement', 'Alert'];
            if (!allowed.includes(editData.type)) {
                alert('Invalid type. Use one of: Article, Announcement, Alert');
                setIsSaving(false);
                return;
            }
            const token = await getToken();
            await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/articles/${editData.id}`,
                {
                    title: editData.title.trim(),
                    content: editData.content.trim(),
                    type: editData.type,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEditOpen(false);
            refresh();
        } catch (err) {
            console.error('Update failed:', err);
            const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
            alert(`Failed to update the post.${serverMsg ? `\n${serverMsg}` : ''}`);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchMyArticles = async () => {
        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/articles/doctor/${user.uid}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setArticles(response.data.data.articles);
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

    const truncateContent = (content, maxLength = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-light-bg dark:bg-dark-bg p-6">
                <div className="max-w-6xl mx-auto">
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
            <div className="min-h-screen bg-light-bg dark:bg-dark-bg p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-12">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Error Loading Posts
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={fetchMyArticles}
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
                {/* Stats Overview */}
                {articles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-light-surface dark:bg-dark-bg rounded-lg px-4 py-6 shadow-sm">
                            <div className="text-4xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                {articles.length}
                            </div>
                            <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                Total Posts
                            </div>
                        </div>
                        <div className="bg-light-surface dark:bg-dark-bg rounded-lg p-4 shadow-sm">
                            <div className="text-4xl font-bold text-light-primary-text dark:text-dark-primary-text">
                                {articles.reduce((sum, article) => sum + article.views, 0)}
                            </div>
                            <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
                                Total Views
                            </div>
                        </div>
                    </div>
                )}

                {/* Articles Grid */}
                {articles.length === 0 ? (
                    <div className="text-center py-12">
                        <Edit3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            No Posts Yet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Start writing your first post to share your medical expertise
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {articles.map((article) => (
                            <PostCard
                                key={article._id}
                                post={article}
                                showAuthor={false}
                                showActions={true}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                showCommentsBookmarks={false}
                            />
                        ))}
                    </div>
                )}
            </div>
            {/* Edit Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4">
                    <div className="w-full max-w-3xl max-h-[90vh] bg-light-surface dark:bg-dark-bg rounded-lg shadow-xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border flex-shrink-0">
                            <h3 className="text-lg font-semibold text-light-primary-text dark:text-dark-primary-text">Edit Post</h3>
                            <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-light-bg dark:hover:bg-dark-surface rounded">
                                ✕
                            </button>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm mb-1 text-light-secondary-text dark:text-dark-secondary-text">Title</label>
                                <textarea
                                    className="w-full bg-transparent border border-light-border dark:border-dark-border rounded p-2 text-light-primary-text dark:text-dark-primary-text"
                                    rows={2}
                                    value={editData.title}
                                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-light-secondary-text dark:text-dark-secondary-text">Type</label>
                                <select
                                    className="w-full bg-transparent border border-light-border dark:border-dark-border rounded p-2 text-light-primary-text dark:text-dark-primary-text"
                                    value={editData.type}
                                    onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="Article">Article</option>
                                    <option value="Announcement">Announcement</option>
                                    <option value="Alert">Alert</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-light-secondary-text dark:text-dark-secondary-text">Content</label>
                                <textarea
                                    className="w-full bg-transparent border border-light-border dark:border-dark-border rounded p-2 text-light-primary-text dark:text-dark-primary-text leading-relaxed"
                                    rows={16}
                                    value={editData.content}
                                    onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border flex-shrink-0">
                            <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm">Cancel</button>
                            <button onClick={submitEdit} disabled={isSaving || !editData.title.trim() || !editData.content.trim()} className="px-4 py-2 rounded bg-light-primary dark:bg-dark-primary text-white text-sm disabled:opacity-60">
                                {isSaving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyArticles;