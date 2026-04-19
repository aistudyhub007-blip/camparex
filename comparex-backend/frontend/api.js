const API_URL = "http://localhost:5001/api";

// Helper function
async function request(url, method = "GET", body = null, token = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) options.body = JSON.stringify(body);
  if (token) options.headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${url}`, options);
  return res.json();
}

// ================= AUTH =================
const auth = {
  login: (email, password) =>
    request("/auth/login", "POST", { email, password }),

  signup: (name, email, password) =>
    request("/auth/signup", "POST", { name, email, password }),
};

// ================= PRODUCTS =================
const products = {
  getAll: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return request(`/products?${params}`);
  },

  getById: (id) => request(`/products/${id}`),
};

// ================= CART =================
const cart = {
  add: (productId, token) =>
    request("/cart/add", "POST", { productId }, token),

  get: (token) => request("/cart", "GET", null, token),

  remove: (productId, token) =>
    request("/cart/remove", "POST", { productId }, token),
};

// ================= ORDERS =================
const orders = {
  create: (paymentMethod, token) =>
    request("/order", "POST", { paymentMethod }, token),

  getAll: (token) => request("/orders", "GET", null, token),
};

// ================= PAYMENT =================
const payment = {
  initRazorpay: (orderId, onSuccess, onFail) => {
    const options = {
      key: "YOUR_RAZORPAY_KEY",
      amount: 50000,
      currency: "INR",
      name: "CompareX",
      description: "Order Payment",
      handler: function (response) {
        onSuccess(response);
      },
      modal: {
        ondismiss: function () {
          onFail();
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  },
};

// ================= ADMIN =================
const admin = {
  login: (email, password) =>
    request("/admin/login", "POST", { email, password }),

  getDashboard: (token) =>
    request("/admin/dashboard", "GET", null, token),

  addProduct: (data, token) =>
    request("/admin/product", "POST", data, token),

  deleteProduct: (id, token) =>
    request(`/admin/product/${id}`, "DELETE", null, token),

  createCoupon: (data, token) =>
    request("/admin/coupon", "POST", data, token),
};

// ================= EXPORT =================
const API = {
  auth,
  products,
  cart,
  orders,
  payment,
  admin,
};
