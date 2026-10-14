import { useState } from 'react';
import Exercise1Page from './pages/Exercise1Page';
import ShopPage from './pages/ShopPage';
import ApiProductsPage from './pages/ApiProductsPage';
import BlogPage from './pages/BlogPage';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('homework');

  return (
    <div>
      {/* Navbar Điều Hướng Top */}
      <nav className="navbar">
        <div className="logo">React Lab 2</div>
        <div className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'ex1' ? 'active' : ''}`}
            onClick={() => setActiveTab('ex1')}
          >
            Exercise 1
          </button>
          <button
            className={`nav-btn ${activeTab === 'ex2' ? 'active' : ''}`}
            onClick={() => setActiveTab('ex2')}
          >
            Exercise 2
          </button>
          <button
            className={`nav-btn ${activeTab === 'ex3' ? 'active' : ''}`}
            onClick={() => setActiveTab('ex3')}
          >
            Exercise 3
          </button>
          <button
            className={`nav-btn ${activeTab === 'homework' ? 'active' : ''}`}
            onClick={() => setActiveTab('homework')}
          >
            Homework (Blog)
          </button>
        </div>
      </nav>

      {/* Hiển Thị Màn Hình Tương Ứng */}
      <main>
        {activeTab === 'ex1' && <Exercise1Page />}
        {activeTab === 'ex2' && <ShopPage />}
        {activeTab === 'ex3' && <ApiProductsPage />}
        {activeTab === 'homework' && <BlogPage />}
      </main>
    </div>
  );
}