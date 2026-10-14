// src/pages/Exercise1Page.jsx
import ProductCard from '../components/ProductCard';

const sampleProducts = [
  { id: 1, name: 'Keyboard', price: 25, inStock: true },
  { id: 2, name: 'Mouse', price: 12, inStock: false },
  { id: 3, name: 'Monitor', price: 180, inStock: true }
];

export default function Exercise1Page() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Exercise 1: Components & Props</h2>
        <p>Hiển thị danh sách sản phẩm mẫu sử dụng component ProductCard tái sử dụng.</p>
      </div>

      <div className="products-grid-ex1">
        {sampleProducts.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.price}
            inStock={p.inStock}
          />
        ))}
      </div>
    </div>
  );
}