// src/pages/ApiProductsPage.jsx
import { useState, useEffect } from 'react';
import { getProducts, getProductDetail } from '../services/productApi';

export default function ApiProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const limit = 12;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const skip = (page - 1) * limit;

    getProducts(limit, skip, controller.signal)
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page]);

  const handleSelectProduct = async (id) => {
    setLoadingDetail(true);
    try {
      const data = await getProductDetail(id);
      setSelectedProduct(data);
    } catch (err) {
      alert('Failed to load detail: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Exercise 3: Products (DummyJSON)</h2>
      </div>

      <div className="api-layout">
        <div className="api-main-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading API products...</p>
            </div>
          )}

          {error && <div className="error-box">Error: {error}</div>}

          {!loading && !error && (
            <>
              <div className="api-grid">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="api-card"
                    onClick={() => handleSelectProduct(p.id)}
                  >
                    <div className="api-card-img">
                      <img src={p.thumbnail} alt={p.title} />
                    </div>
                    <h4 className="api-card-title">{p.title}</h4>
                    <p className="api-card-price">${p.price}</p>
                  </div>
                ))}
              </div>

              {/* Phân trang */}
              <div className="pagination-bar">
                <button
                  className="btn-page"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  className="btn-page"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Panel Chi tiết bên phải */}
        {selectedProduct && (
          <div className="detail-panel-card">
            <button
              className="btn-close-detail"
              onClick={() => setSelectedProduct(null)}
            >
              Close ✕
            </button>
            {loadingDetail ? (
              <p>Loading detail...</p>
            ) : (
              <div className="detail-content">
                <img src={selectedProduct.thumbnail} alt={selectedProduct.title} />
                <h3>{selectedProduct.title}</h3>
                <p className="detail-desc">{selectedProduct.description}</p>
                <div className="detail-info-row">
                  <span>Price:</span>
                  <strong>${selectedProduct.price}</strong>
                </div>
                <div className="detail-info-row">
                  <span>Rating:</span>
                  <strong>⭐ {selectedProduct.rating} / 5</strong>
                </div>
                <div className="detail-info-row">
                  <span>Stock:</span>
                  <strong>{selectedProduct.stock} items</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}