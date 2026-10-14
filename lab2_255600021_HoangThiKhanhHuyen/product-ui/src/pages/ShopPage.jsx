// src/pages/ShopPage.jsx
import { useState, useEffect } from 'react';
import { fakeFetchProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fakeFetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.title = `Cart (${totalCount})`;
  }, [cart]);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Exercise 2: Product List & Shopping Cart</h2>
      </div>

      <div className="shop-layout">
        {/* Cột danh sách sản phẩm */}
        <div className="main-shop-content">
          <div className="filters-bar">
            <input
              type="text"
              className="custom-input"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="custom-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Accessories">Accessories</option>
              <option value="Displays">Displays</option>
              <option value="Computers">Computers</option>
            </select>
          </div>

          <div className="products-grid">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                price={p.price}
                inStock={p.inStock}
                onAddToCart={() => handleAddToCart(p)}
              />
            ))}
          </div>
        </div>

        {/* Cột giỏ hàng bên phải */}
        <div className="cart-card">
          <h3 className="cart-title">Cart</h3>
          {cart.length === 0 ? (
            <p className="empty-cart-msg">Cart is empty</p>
          ) : (
            <>
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span className="cart-item-name">{item.name} × {item.quantity}</span>
                    <div className="cart-item-right">
                      <span className="cart-item-price">{item.price * item.quantity} USD</span>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-divider"></div>
              <div className="cart-total-bar">
                <span>Total:</span>
                <strong>{totalPrice} USD</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}