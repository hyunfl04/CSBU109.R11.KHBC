// src/data/products.js
export const products = [
  { id: 1, name: 'Keyboard', price: 25, category: 'Accessories', inStock: true },
  { id: 2, name: 'Mouse', price: 12, category: 'Accessories', inStock: true },
  { id: 3, name: 'USB Cable', price: 8, category: 'Accessories', inStock: true },
  { id: 4, name: 'Monitor', price: 180, category: 'Displays', inStock: true },
  { id: 5, name: 'Projector', price: 450, category: 'Displays', inStock: true },
  { id: 6, name: 'Laptop', price: 900, category: 'Computers', inStock: true },
  { id: 7, name: 'Mini PC', price: 350, category: 'Computers', inStock: true }
];

export function fakeFetchProducts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(products), 1000);
  });
}