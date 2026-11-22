const API_URL = 'http://localhost:5001/api/v1/products';
let editingId = null;

async function loadProducts() {
  const errorDiv = document.getElementById('error-message');
  const category = document.getElementById('filterCategory').value;
  
  try {
    errorDiv.style.display = 'none';
    const url = (category && category !== 'All Categories') 
      ? `${API_URL}?category=${encodeURIComponent(category)}` 
      : API_URL;

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
    renderProducts(result.data);
  } catch (error) {
    errorDiv.textContent = `Error fetching products: ${error.message}`;
    errorDiv.style.display = 'block';
  }
}

function renderProducts(products) {
  const tbody = document.getElementById('product-list');
  tbody.innerHTML = '';

  products.forEach(p => {
    const tr = document.createElement('tr');
    
    if (editingId === p.id) {
      tr.innerHTML = `
        <td>${p.id}</td>
        <td><input type="text" id="edit-name-${p.id}" value="${p.name}"></td>
        <td><input type="number" id="edit-price-${p.id}" value="${p.price}"></td>
        <td><input type="text" id="edit-category-${p.id}" value="${p.category}"></td>
        <td>
          <button class="btn-save" onclick="saveEdit(${p.id})">Save</button>
          <button onclick="cancelEdit()">Cancel</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${Number(p.price).toLocaleString()} VND</td>
        <td>${p.category}</td>
        <td>
          <button class="btn-edit" onclick="startEdit(${p.id})">Edit</button>
          <button class="btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

async function addProduct() {
  const name = document.getElementById('name').value;
  const price = document.getElementById('price').value;
  const category = document.getElementById('category').value;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, category })
    });
    if (!res.ok) throw new Error('Failed to add product');
    
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    document.getElementById('category').value = '';
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

function startEdit(id) { editingId = id; loadProducts(); }
function cancelEdit() { editingId = null; loadProducts(); }

async function saveEdit(id) {
  const name = document.getElementById(`edit-name-${id}`).value;
  const price = document.getElementById(`edit-price-${id}`).value;
  const category = document.getElementById(`edit-category-${id}`).value;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, category })
    });
    if (!res.ok) throw new Error('Failed to update product');
    editingId = null;
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure?')) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);