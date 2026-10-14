const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="120" viewBox="0 0 150 120"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14">No image</text></svg>';

export default function ProductCard({ name, price, inStock = true, image = PLACEHOLDER, onAddToCart }) {
  return (
    <div className="card">
      <div className="card-img-box">
        {price < 20 && <span className="badge-low">Low price!</span>}
        <img src={image} alt={name} />
      </div>
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        <p className="card-price">{price.toLocaleString()} USD</p>
        {inStock ? (
          <span className="stock-tag in">In stock</span>
        ) : (
          <span className="stock-tag out">Sold out</span>
        )}
        {inStock && onAddToCart && (
          <button className="btn-primary" onClick={onAddToCart}>
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
}