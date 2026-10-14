export default function PostCard({ post, onView, onDelete }) {
  const likes = typeof post.reactions === 'number' ? post.reactions : post.reactions?.likes ?? 0;
  const dislikes = typeof post.reactions === 'object' ? post.reactions?.dislikes ?? 0 : 0;

  return (
    <div className="post-card">
      <h3 className="post-title">{post.title}</h3>
      <div className="post-tags">
        {post.tags?.map((tag, i) => (
          <span key={i} className="tag">#{tag}</span>
        ))}
      </div>
      <div className="post-reactions">
        <span>👍 {likes}</span>
        {dislikes > 0 && <span>👎 {dislikes}</span>}
      </div>
      <div className="post-actions">
        <button className="btn-secondary" onClick={() => onView(post)}>View</button>
        <button className="btn-danger" onClick={() => onDelete(post.id)}>Delete</button>
      </div>
    </div>
  );
}