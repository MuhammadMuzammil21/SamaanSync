# 💼 SamaanSync - Store Management System

A Node.js backend project to manage products, stores, suppliers, and related inventory systems. It features modular route handling, secure authentication, inventory tracking, and more.

---

## 📁 Project Structure

```
SamaanSync/
├── helpers/                 # Utility helpers
├── middleware/              # Custom middleware (e.g., auth)
├── node_modules/            # Project dependencies
├── POSTMAN Collection/      # Postman API collection
├── routes/                  # API route handlers
├── utils/                   # Utility functions
├── .env                     # Environment variables
├── SamaanSync.dll           # DLL for database schema
├── SamaanSyncDB.sql         # SQL script to initialize DB
├── db.js                    # Database connection logic
├── package.json             # Project metadata and scripts
├── package-lock.json        # Dependency lock file
├── README.md                # Project documentation
└── server.js                # Application entry point
```

---

## ⚙️ Getting Started

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://npmjs.com/)
- [Postman](https://www.postman.com/) *(for API testing)*

### 🚀 Setup

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd <project_directory>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory with appropriate keys (e.g., database URLs, JWT secrets).

4. **Start the server:**

   ```bash
   npm start
   ```

---

## 📌 API Endpoints

| Feature                     | Route                        |
|----------------------------|------------------------------|
| Authentication             | `/auth`                      |
| Inventory                  | `/inventory`                 |
| Pricing                    | `/pricing`                   |
| Product Categories         | `/productCategories`         |
| Products                   | `/products`                  |
| Product Transactions       | `/productTransactions`       |
| Store Products             | `/storeProducts`             |
| Stores                     | `/stores`                    |
| Supplier Order Products    | `/supplierOrderProducts`     |
| Suppliers                  | `/suppliers`                 |

---

## 📓 Database

- Use `SamaanSyncDB.sql` to initialize your local database.
- `SamaanSync.dll` might contain schema or additional database config logic.

---

## 🛆 Dependencies

- `express` - Web server framework  
- `dotenv` - Environment variable loader  
- `jsonwebtoken` - JWT for auth  
- `pg` - PostgreSQL client  
- `sqlite3` - SQLite support  
- `cors` - Cross-origin resource sharing  
- `bull` - Queue system (e.g., background jobs)  
- `express-rate-limit` - Rate limiter middleware  
- `body-parser` - Parsing middleware  
- `basic-auth` - Basic HTTP auth  
