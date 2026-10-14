const BASE_URL = 'https://dummyjson.com';

export async function getPosts(limit = 10, skip = 0, signal) {
  const res = await fetch(`${BASE_URL}/posts?limit=${limit}&skip=${skip}`, { signal });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function searchPosts(query, signal) {
  const res = await fetch(`${BASE_URL}/posts/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error('Failed to search posts');
  return res.json();
}

export async function getPostComments(postId) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function createPost(postData) {
  const res = await fetch(`${BASE_URL}/posts/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

export async function deletePostApi(id) {
  const res = await fetch(`${BASE_URL}/posts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete post');
  return res.json();
}