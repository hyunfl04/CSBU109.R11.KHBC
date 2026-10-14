const BASE_URL = 'https://dummyjson.com';

export async function getProducts(limit = 12, skip = 0, signal) {
  const res = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`, { signal });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function getProductDetail(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}