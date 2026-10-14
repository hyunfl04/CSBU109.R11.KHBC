import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { getPosts, searchPosts, getPostComments, createPost, deletePostApi } from '../services/blogApi';
import PostCard from '../components/PostCard';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const limit = 10;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const skip = (page - 1) * limit;
    const req = debouncedSearch.trim()
      ? searchPosts(debouncedSearch, controller.signal)
      : getPosts(limit, skip, controller.signal);

    req
      .then((data) => {
        setPosts(data.posts);
        setTotal(data.total);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, debouncedSearch]);

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return alert('Please enter both Title and Body!');

    try {
      const newPost = await createPost({ title, body, userId: 1 });
      setPosts([newPost, ...posts]);
      setTitle('');
      setBody('');
      alert('Post created!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleView = async (post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const res = await getPostComments(post.id);
      setComments(res.comments);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePostApi(id);
      setPosts(posts.filter((p) => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container-narrow">
      <h2 className="section-title">Mini Blog Manager</h2>

      {/* Form thêm bài */}
      <form onSubmit={handleAddPost} className="form-card">
        <h3>New post</h3>
        <input
          type="text"
          className="input-field"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="textarea-field"
          placeholder="Body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" className="btn-primary">Add post</button>
      </form>

      {/* Search Bar Debounce */}
      <input
        type="text"
        className="input-field search-blog"
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1);
        }}
      />

      {loading && <div className="loading-spinner">Loading posts...</div>}
      {error && <div className="error-banner">Error: {error}</div>}

      {!loading && !error && (
        <>
          <div className="posts-stack">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onView={handleView} onDelete={handleDelete} />
            ))}
          </div>

          {/* Phân Trang */}
          {!debouncedSearch.trim() && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {totalPages || 1}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* View Comments Panel */}
      {selectedPost && (
        <div className="modal-card">
          <button className="btn-close" onClick={() => setSelectedPost(null)}>Close ✕</button>
          <h3>{selectedPost.title}</h3>
          <p>{selectedPost.body}</p>
          <hr />
          <h4>Comments</h4>
          {loadingComments ? (
            <p>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="empty-text">No comments found.</p>
          ) : (
            <div className="comments-stack">
              {comments.map((c) => (
                <div key={c.id} className="comment-box">
                  <strong>@{c.user?.username || 'user'}:</strong> {c.body}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}