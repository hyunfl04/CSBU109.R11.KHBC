# 1. Install backend dependencies
cd lab4-homework/be
npm install

# 2. Configure environment variables in be/.env (excluded from Git via .gitignore)
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/shopadmin_lab4
JWT_SECRET=super_secret_jwt_key_lab4_2026
JWT_EXPIRES_IN=1d

# 3. Start MongoDB locally and launch the Express API server
node server.js
# Expected output:
# Connected to MongoDB
# ShopAdmin API running at http://localhost:4000/api/v1

# 4. Launch Frontend Web UI
# Open lab4-homework/fe/index.html with VS Code Live Server (http://127.0.0.1:5500)
