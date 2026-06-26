(function () {
  "use strict";

  const PRODUCT_KEY = "community_surplus_products_v1";
  const WISHLIST_KEY = "community_surplus_wishlist_v1";
  const USERS_KEY = "community_surplus_users_v1";
  const CURRENT_USER_KEY = "community_surplus_current_user_v1";
  const TOKEN_KEY = "community_surplus_token_v1";
  const PURCHASE_KEY = "community_surplus_purchases_v1";
  const API_BASE_URL = "http://localhost:5000/api";
  const FALLBACK_IMAGE = "images/placeholder.svg";

  const sampleProducts = [
    {
      id: "p-study-table",
      productName: "Wooden Study Table",
      description: "Compact table with two drawers, useful for students and home office setups.",
      category: "Furniture",
      condition: "Good",
      mrp: 4500,
      sellingPrice: 1800,
      quantityAvailable: 1,
      image: "images/table.svg",
      location: "Ameerpet",
      contactNumber: "9876543210",
      status: "Available",
      sellerId: "user-demo",
      sellerName: "Demo Seller",
      createdAt: "2026-06-12"
    },
    {
      id: "p-bicycle",
      productName: "City Bicycle",
      description: "Single-speed bicycle with recently replaced brake pads.",
      category: "Vehicles",
      condition: "Used",
      mrp: 8500,
      sellingPrice: 3200,
      quantityAvailable: 1,
      image: "images/cycle.svg",
      location: "Begumpet",
      contactNumber: "9876501234",
      status: "Available",
      sellerId: "user-demo",
      sellerName: "Demo Seller",
      createdAt: "2026-06-10"
    },
    {
      // BUG FIX: Updated to match your current project scope category change
      id: "p-books",
      productName: "Engineering Stationery Set",
      description: "Reference stationery tools and items for first-year engineering subjects in clean condition.",
      category: "Stationery",
      condition: "Like New",
      mrp: 3600,
      sellingPrice: 900,
      quantityAvailable: 4,
      image: "images/books.svg",
      location: "Kukatpally",
      contactNumber: "9876512345",
      status: "Available",
      sellerId: "user-guest",
      sellerName: "Riya Sharma",
      createdAt: "2026-06-09"
    },
    {
      id: "p-mixer",
      productName: "Kitchen Mixer",
      description: "Working mixer grinder with two jars. Best for a hostel or shared flat.",
      category: "Appliances",
      condition: "Good",
      mrp: 2800,
      sellingPrice: 1200,
      quantityAvailable: 1,
      image: "images/mixer.svg",
      location: "Madhapur",
      contactNumber: "9876523456",
      status: "Available",
      sellerId: "user-guest",
      sellerName: "Riya Sharma",
      createdAt: "2026-06-08"
    },
    {
      id: "p-chair",
      productName: "Office Chair",
      description: "Adjustable chair with smooth wheels and comfortable back support.",
      category: "Furniture",
      condition: "Good",
      mrp: 6500,
      sellingPrice: 2400,
      quantityAvailable: 2,
      image: "images/chair.svg",
      location: "Gachibowli",
      contactNumber: "9876534567",
      status: "Available",
      sellerId: "user-demo",
      sellerName: "Demo Seller",
      createdAt: "2026-06-07"
    },
    {
      id: "p-lamp",
      productName: "Desk Lamp",
      description: "Warm desk lamp with adjustable neck and low power usage.",
      category: "Home",
      condition: "Like New",
      mrp: 1600,
      sellingPrice: 650,
      quantityAvailable: 1,
      image: "images/lamp.svg",
      location: "Secunderabad",
      contactNumber: "9876545678",
      status: "Available",
      sellerId: "user-guest",
      sellerName: "Riya Sharma",
      createdAt: "2026-06-06"
    }
  ];

  const sampleUsers = [
    {
      id: "user-demo",
      name: "Demo Seller",
      email: "demo@community.test",
      password: "demo123",
      phone: "9876543210",
      location: "Ameerpet",
      bio: "Listing useful items for the neighborhood."
    }
  ];

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("Local storage is not available.", error);
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("Local storage is not available.", error);
    }
  }

  function readJSON(key, fallback) {
    const raw = storageGet(key);
    if (!raw) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    storageSet(key, JSON.stringify(value));
  }

  function seedData() {
    if (!storageGet(PRODUCT_KEY)) {
      writeJSON(PRODUCT_KEY, sampleProducts);
    }
    if (!storageGet(USERS_KEY)) {
      writeJSON(USERS_KEY, sampleUsers);
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHTML(value);
  }

  function newId(prefix) {
    const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return prefix + "-" + suffix;
  }

  function normalizeProduct(product) {
    let image = product.image || product.image_url || FALLBACK_IMAGE;
    if (image && image.startsWith("/uploads/")) {
      image = API_BASE_URL + image;
    }

    return {
      id: product.product_id !== undefined ? String(product.product_id) : (product.id || newId("p")),
      productName: product.product_name || product.productName || "Untitled Product",
      description: product.description || "",
      category: product.category_name || product.category || "Other",
      category_id: product.category_id || null, 
      condition: product.product_condition || product.condition || "Used",
      mrp: Number(product.mrp || 0),
      sellingPrice: Number(product.selling_price || product.sellingPrice || 0),
      quantityAvailable: Number(product.quantity_available ?? product.quantityAvailable ?? 1),
      image,
      location: product.location || "Not specified",
      contactNumber: product.contact_number || product.contactNumber || "",
      status: product.status || "Available",
      sellerId: product.seller_id !== undefined ? String(product.seller_id) : (product.sellerId || "guest"),
      sellerName: product.seller_name || product.sellerName || "Community Seller",
      createdAt: product.created_at || product.createdAt || new Date().toISOString().slice(0, 10)
    };
  }

  function getProducts() {
    return readJSON(PRODUCT_KEY, []).map(normalizeProduct);
  }

  function saveProducts(products) {
    writeJSON(PRODUCT_KEY, products.map(normalizeProduct));
  }

  function getProductById(id) {
    return getProducts().find(function (product) {
      return String(product.id) === String(id);
    });
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) {
      return "Recently";
    }
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  }

  function shortText(text, size) {
    const clean = String(text || "");
    if (clean.length <= size) {
      return clean;
    }
    return clean.slice(0, size - 3).trim() + "...";
  }

  function getWishlist() {
    return readJSON(WISHLIST_KEY, []);
  }

  function saveWishlist(ids) {
    writeJSON(WISHLIST_KEY, Array.from(new Set(ids)));
  }

  function isWishlisted(id) {
    return getWishlist().map(String).includes(String(id));
  }

  async function toggleWishlist(id) {
    const ids = getWishlist();
    const saved = ids.map(String).includes(String(id));

    if (getAuthToken()) {
      if (saved) {
        await apiFetch("/wishlist/remove/" + encodeURIComponent(id), { method: "DELETE" });
      } else {
        await apiFetch("/wishlist/add", {
          method: "POST",
          body: { product_id: id }
        });
      }
    }

    const next = saved ? ids.filter(function (item) {
      return String(item) !== String(id);
    }) : ids.concat(id);

    saveWishlist(next);
    return !saved;
  }

  function updateWishlistButton(button) {
    const id = button.dataset.wishlistButton;
    const saved = isWishlisted(id);
    button.classList.toggle("is-saved", saved);
    button.setAttribute("aria-pressed", String(saved));
    button.textContent = saved ? "Saved" : "Save";
  }

  function bindWishlistButtons(scope, afterToggle) {
    const root = scope || document;
    root.querySelectorAll("[data-wishlist-button]").forEach(function (button) {
      updateWishlistButton(button);
      button.addEventListener("click", async function () {
        const id = button.dataset.wishlistButton;
        button.disabled = true;

        try {
          const saved = await toggleWishlist(id);
          updateWishlistButton(button);
          if (typeof afterToggle === "function") {
            afterToggle(id, saved);
          }
        } catch (error) {
          window.alert(error.message || "Wishlist update failed. Please log in and try again.");
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  function productCard(product, options) {
    const settings = options || {};
    const item = normalizeProduct(product);
    const sold = item.status.toLowerCase() === "sold";
    const ownerActions = settings.ownerActions ? `
      <div class="owner-actions">
       <a class="button secondary" href="edit_products.html?id=${encodeURIComponent(item.id)}">Edit</a>
        <button class="button secondary" type="button" data-toggle-status="${escapeAttr(item.id)}">${sold ? "Mark Available" : "Mark Sold"}</button>
        <button class="button danger" type="button" data-delete-product="${escapeAttr(item.id)}">Delete</button>
      </div>
    ` : "";

    return `
      <article class="product-card${sold ? " is-sold" : ""}" data-product-card="${escapeAttr(item.id)}">
        <a class="product-media" href="product_details.html?id=${encodeURIComponent(item.id)}">
          <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.productName)}">
          <span class="product-badge">${escapeHTML(item.status)}</span>
        </a>
        <div class="product-body">
          <div>
            <h3><a href="product_details.html?id=${encodeURIComponent(item.id)}">${escapeHTML(item.productName)}</a></h3>
            <p>${escapeHTML(shortText(item.description, 96))}</p>
          </div>
          <div class="product-facts">
            <span class="price-pill">${escapeHTML(formatMoney(item.sellingPrice))}</span>
            <span class="status-pill">Qty ${escapeHTML(item.quantityAvailable)}</span>
            <span class="status-pill">${escapeHTML(item.category)}</span>
            <span class="status-pill">${escapeHTML(item.condition)}</span>
          </div>
          <p class="muted">${escapeHTML(item.location)} - Listed ${escapeHTML(formatDate(item.createdAt))}</p>
        </div>
        <div class="product-actions">
          <a class="button secondary" href="product_details.html?id=${encodeURIComponent(item.id)}">View Details</a>
          <button class="wishlist-button" type="button" data-wishlist-button="${escapeAttr(item.id)}" aria-pressed="false">Save</button>
        </div>
        ${ownerActions}
      </article>
    `;
  }

  function renderProductGrid(container, products, options) {
    if (!container) {
      return;
    }

    if (!products.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No products found</h3>
          <p class="muted">Try a different search or add the first product for your community.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="product-grid">
        ${products.map(function (product) {
          return productCard(product, options);
        }).join("")}
      </div>
    `;
    bindWishlistButtons(container);
  }

  function getUsers() {
    return readJSON(USERS_KEY, []);
  }

  function saveUsers(users) {
    writeJSON(USERS_KEY, users);
  }

  function getCurrentUser() {
    return readJSON(CURRENT_USER_KEY, null);
  }

  function setCurrentUser(user) {
    writeJSON(CURRENT_USER_KEY, user);
  }

  function getAuthToken() {
    return storageGet(TOKEN_KEY);
  }

  function setAuth(user, token) {
    setCurrentUser(user);
    if (token) {
      storageSet(TOKEN_KEY, token);
    } else {
      storageRemove(TOKEN_KEY);
    }
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function publicUser(user) {
    if (!user) {
      return null;
    }
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  function shouldUseLocalAuth(error) {
    return Boolean(error && (error.isNetworkError || error.status === 404));
  }

  function loginUserLocal(credentials) {
    const email = normalizeEmail(credentials.email);
    const user = getUsers().find(function (candidate) {
      return normalizeEmail(candidate.email) === email && candidate.password === credentials.password;
    });

    if (!user) {
      throw new Error("Email or password is incorrect.");
    }

    setAuth(publicUser(user));
    return publicUser(user);
  }

  function registerUserLocal(payload) {
    const email = normalizeEmail(payload.email);
    const users = getUsers();
    const existingUser = users.find(function (candidate) {
      return normalizeEmail(candidate.email) === email;
    });

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    const user = {
      id: newId("user"),
      name: String(payload.name || "").trim(),
      email,
      password: payload.password,
      phone: String(payload.phone || "").trim(),
      location: String(payload.location || "").trim(),
      bio: ""
    };

    users.push(user);
    saveUsers(users);
    setAuth(publicUser(user));
    return publicUser(user);
  }

  function logout() {
    storageRemove(CURRENT_USER_KEY);
    storageRemove(TOKEN_KEY);
    window.location.href = "index.html";
  }

  function setMessage(element, text, type) {
    if (!element) {
      return;
    }
    element.textContent = text;
    element.classList.remove("error", "success");
    if (type) {
      element.classList.add(type);
    }
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function addPurchase(product, quantity) {
    const item = normalizeProduct(product);
    const user = getCurrentUser();
    const count = Number(quantity || 1);
    const purchases = readJSON(PURCHASE_KEY, []);
    purchases.unshift({
      id: newId("purchase"),
      buyerId: user ? user.id : "guest",
      buyerName: user ? user.name : "Guest Buyer",
      productId: item.id,
      productName: item.productName,
      quantity: count,
      price: item.sellingPrice * count,
      sellerName: item.sellerName,
      purchaseDate: new Date().toISOString()
    });
    writeJSON(PURCHASE_KEY, purchases);
  }

  function getPurchases() {
    return readJSON(PURCHASE_KEY, []);
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function apiFetch(path, options) {
    const settings = options || {};
    const headers = { ...(settings.headers || {}) };
    const token = getAuthToken();
    let body = settings.body;

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    if (body && !(body instanceof FormData) && typeof body !== "string") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(API_BASE_URL + path, {
        ...settings,
        headers,
        body
      });
    } catch (error) {
      const fetchError = new Error("Could not connect to the backend server.");
      fetchError.isNetworkError = true;
      throw fetchError;
    }

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      const requestError = new Error(data.message || "Request failed.");
      requestError.status = response.status;
      throw requestError;
    }

    return data;
  }

  async function fetchProducts() {
    try {
      const data = await apiFetch("/products");
      const products = (data.products || []).map(normalizeProduct);
      saveProducts(products);
      return products;
    } catch (error) {
      console.warn("Using local product fallback.", error);
      return getProducts();
    }
  }

  async function fetchProductById(id) {
    try {
      const data = await apiFetch("/products/" + encodeURIComponent(id));
      return normalizeProduct(data.product);
    } catch (error) {
      return getProductById(id);
    }
  }

  async function fetchMyProducts() {
    const user = getCurrentUser();
    if (!user) {
      return [];
    }
    const allProducts = await fetchProducts();
    const userId = String(user.user_id || user.id);
    return allProducts.filter(function (product) {
      return String(product.sellerId) === userId;
    });
  }

  async function createProduct(formData) {
    const data = await apiFetch("/products", {
      method: "POST",
      body: formData
    });
    return normalizeProduct(data.product);
  }

 async function updateProductRemote(id, payload) {

  const data = await apiFetch(
    "/products/" + encodeURIComponent(id),
    {
      method: "PUT",
      body: payload
    }
  );

  return normalizeProduct(data.product);

}

  async function deleteProductRemote(id) {
    return apiFetch("/products/" + encodeURIComponent(id), { method: "DELETE" });
  }

  async function confirmPurchaseRemote(productId, quantity) {
    const user = getCurrentUser();
    return apiFetch("/products/" + encodeURIComponent(productId) + "/purchase", {
      method: "POST",
      body: {
        quantity: Number(quantity || 1)
      }
    });
  }

  async function fetchWishlistProducts() {
    const data = await apiFetch("/wishlist");
    const products = (data.products || []).map(normalizeProduct);
    saveWishlist(products.map(function (product) {
      return product.id;
    }));
    return products;
  }

  async function loginUser(credentials) {
    try {
      const data = await apiFetch("/login", {
        method: "POST",
        body: credentials
      });
      setAuth(data.user, data.token);
      return data.user;
    } catch (error) {
      if (shouldUseLocalAuth(error)) {
        return loginUserLocal(credentials);
      }
      throw error;
    }
  }

  async function registerUser(payload) {
    try {
      const data = await apiFetch("/register", {
        method: "POST",
        body: payload
      });
      setAuth(data.user, data.token);
      return data.user;
    } catch (error) {
      if (shouldUseLocalAuth(error)) {
        return registerUserLocal(payload);
      }
      throw error;
    }
  }

  async function fetchDashboard() {
    return apiFetch("/dashboard");
  }

  async function fetchProfile() {
    const data = await apiFetch("/profile");
    setCurrentUser(data.user);
    
    const form = document.querySelector("[data-profile-form]");
    if (form && data.user) {
      form.elements.name.value = data.user.name || "";
      form.elements.email.value = data.user.email || "";
      form.elements.phone.value = data.user.phone || "";
      if (form.elements.location) form.elements.location.value = data.user.location || "";
      if (form.elements.bio) form.elements.bio.value = data.user.bio || "";
    }
    return data.user;
  }

  async function updateProfileRemote(payload) {
    const data = await apiFetch("/profile", {
      method: "PUT",
      body: payload
    });
    setCurrentUser(data.user);
    return data.user;
  }

  function initNav() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    const user = getCurrentUser();
    const links = document.querySelectorAll("[data-nav-links] a");
    const toggle = document.querySelector("[data-nav-toggle]");
    const navLinks = document.querySelector("[data-nav-links]");
    const userChip = document.querySelector("[data-user-chip]");

    links.forEach(function (link) {
      const linkPage = link.getAttribute("href").split("?")[0];
      link.classList.toggle("is-active", linkPage === current);
    });

    document.querySelectorAll("[data-auth-only]").forEach(function (node) {
      node.classList.toggle("hidden", !user);
    });

    document.querySelectorAll("[data-guest-only]").forEach(function (node) {
      node.classList.toggle("hidden", Boolean(user));
    });

    if (userChip) {
      userChip.textContent = user ? user.name : "Guest";
    }

    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", logout);
    });

    if (toggle && navLinks) {
      toggle.addEventListener("click", function () {
        navLinks.classList.toggle("is-open");
      });
    }
  }

  function initHomeSearch() {
    const form = document.querySelector("[data-home-search]");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const query = new FormData(form).get("q") || "";
      window.location.href = "products.html?q=" + encodeURIComponent(String(query).trim());
    });
  }

  async function initDashboard() {
    const root = document.querySelector("[data-dashboard]");
    if (!root) {
      return;
    }

    const user = getCurrentUser();
    let stats = {
      listings: 0,
      wishlist: 0,
      purchases: 0,
      recentPurchases: []
    };

    if (user && getAuthToken()) {
      try {
        stats = await fetchDashboard();
      } catch (error) {
        console.warn("Dashboard API failed.", error);
      }
    }

    const recentPurchases = stats.recentPurchases || [];

    root.innerHTML = `
      <div class="metric-grid">
        <div class="metric-card"><span class="muted">Active listings</span><strong>${Number(stats.listings ?? 0)}</strong></div>
        <div class="metric-card"><span class="muted">Wishlist items</span><strong>${Number(stats.wishlist ?? 0)}</strong></div>
        <div class="metric-card"><span class="muted">Confirmed buys</span><strong>${Number(stats.purchases ?? 0)}</strong></div>
      </div>
      <div class="dashboard-grid">
        <section class="panel stack">
          <h2>Next action</h2>
          <p class="muted">${user ? "Add a product or manage your existing listings." : "Log in to manage listings and purchases."}</p>
          <a class="button" href="${user ? "sell.html" : "login.html"}">${user ? "Sell Product" : "Login"}</a>
        </section>
        <section class="panel stack">
          <h2>Recent purchases</h2>
          ${recentPurchases.length ? recentPurchases.map(function (purchase) {
            return `<p><strong>${escapeHTML(purchase.productName)}</strong><br><span class="muted">${escapeHTML(formatMoney(purchase.price))} on ${escapeHTML(formatDate(purchase.purchaseDate))}</span></p>`;
          }).join("") : `<p class="muted">No confirmed purchases yet.</p>`}
        </section>
        <section class="panel stack">
          <h2>Marketplace</h2>
          <p class="muted">Browse listings, save useful items, or confirm a purchase when you actually buy something.</p>
          <a class="button secondary" href="products.html">Browse Products</a>
        </section>
      </div>
    `;
  }

  async function initProfile() {
    const form = document.querySelector("[data-profile-form]");
    if (!form) {
      return;
    }

    const user = getCurrentUser();
    const message = document.querySelector("[data-form-message]");

    if (!user) {
      form.innerHTML = `<div class="notice">Please log in to view and edit your profile.</div><a class="button" href="login.html">Login</a>`;
      return;
    }

    let profile = user;
    if (getAuthToken()) {
      try {
        profile = await fetchProfile();
      } catch (error) {
        console.warn("Profile API failed.", error);
      }
    }

    form.elements.name.value = profile.name || "";
    form.elements.email.value = profile.email || "";
    if (form.elements.phone) form.elements.phone.value = profile.phone || "";
    if (form.elements.location) form.elements.location.value = profile.location || "";
    if (form.elements.bio) form.elements.bio.value = profile.bio || "";

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      
      const updated = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone ? form.elements.phone.value.trim() : "",
        location: form.elements.location ? form.elements.location.value.trim() : "",
        bio: form.elements.bio ? form.elements.bio.value.trim() : ""
      };

      try {
        const saved = getAuthToken() ? await updateProfileRemote(updated) : { ...user, ...updated };
        setCurrentUser(saved);
        setMessage(message, "Profile updated.", "success");
        initNav();
      } catch (error) {
        setMessage(message, error.message || "Profile update failed.", "error");
      }
    });
  }

  async function initMyProducts() {
    const root = document.querySelector("[data-my-products]");
    if (!root) {
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      root.innerHTML = `<div class="notice">Please log in to manage your products.</div><a class="button" href="login.html">Login</a>`;
      return;
    }

    async function renderMine() {
      root.innerHTML = `<div class="empty-state"><p class="muted">Loading your products...</p></div>`;
      const userId = String(user.user_id || user.id);
      const mine = getAuthToken() ? await fetchMyProducts() : getProducts().filter(function (product) {
        return String(product.sellerId) === userId;
      });
      renderProductGrid(root, mine, { ownerActions: true });
    }

    root.addEventListener("click", async function (event) {
      const deleteButton = event.target.closest("[data-delete-product]");
      const toggleButton = event.target.closest("[data-toggle-status]");

      if (deleteButton) {
        const id = deleteButton.dataset.deleteProduct;
        const ok = window.confirm("Delete this product?");
        if (!ok) return;

        try {
          if (getAuthToken()) {
            await deleteProductRemote(id);
          } else {
            saveProducts(getProducts().filter(function (product) {
              return String(product.id) !== String(id);
            }));
          }
          await renderMine();
        } catch (error) {
          window.alert(error.message || "Delete failed.");
        }
      }

      if (toggleButton) {
        const id = toggleButton.dataset.toggleStatus;
        const targetProduct = getProductById(id);
        const currentStatus = targetProduct ? targetProduct.status : "Available";
        const nextStatus = currentStatus === "Available" ? "Sold" : "Available";
        
        try {
          if (getAuthToken()) {
            // BUG FIX: Match structural schema payload parameters
            await updateProductRemote(id, { status: nextStatus });
          } else {
            saveProducts(getProducts().map(function (product) {
              if (String(product.id) !== String(id)) return product;
              return { ...product, status: nextStatus };
            }));
          }
          await renderMine();
        } catch (error) {
          window.alert(error.message || "Status update failed.");
        }
      }
    });

    renderMine().catch(function (error) {
      root.innerHTML = `<div class="notice">${escapeHTML(error.message || "Could not load products.")}</div>`;
    });
  }

  async function initEditProduct() {
    const form = document.querySelector("[data-edit-product-form]");
    if (!form) {
      return;
    }

    const message = document.querySelector("[data-form-message]");
    const id = getParam("id");
    const product = await fetchProductById(id);

    if (!product) {
      form.innerHTML = `<div class="notice">Product not found. Open My Products and choose an item to edit.</div>`;
      return;
    }

    // Populate data handling targets smoothly
    form.elements.product_name.value = product.productName;
    form.elements.description.value = product.description;
    form.elements.category_name.value = product.category;
    form.elements.product_condition.value = product.condition;
    form.elements.mrp.value = product.mrp;
    form.elements.selling_price.value = product.sellingPrice;
    form.elements.quantity_available.value = product.quantityAvailable;
    form.elements.location.value = product.location;
    form.elements.contact_number.value = product.contactNumber;
    form.elements.status.value = product.status;

    const imgPreview = document.getElementById("edit-image-preview");
    if (imgPreview) {
      imgPreview.src = product.image;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const file = form.elements.image.files[0];
      
      // BUG FIX: Handle explicit file form uploads to multipart-compatible nodes
      if (getAuthToken()) {
        const formData = new FormData();
        formData.append("product_name", form.elements.product_name.value.trim());
        formData.append("description", form.elements.description.value.trim());
        formData.append("category_name", form.elements.category_name.value);
        formData.append("product_condition", form.elements.product_condition.value);
        formData.append("mrp", form.elements.mrp.value);
        formData.append("selling_price", form.elements.selling_price.value);
        formData.append("quantity_available", form.elements.quantity_available.value);
        formData.append("location", form.elements.location.value.trim());
        formData.append("contact_number", form.elements.contact_number.value.trim());
        formData.append("status", form.elements.status.value);
        if (file) formData.append("image", file);

        try {
          await updateProductRemote(product.id, formData);
          setMessage(message, "Product updated remotely.", "success");
          window.setTimeout(function () { window.location.href = "my_products.html"; }, 700);
          return;
        } catch (error) {
          setMessage(message, error.message || "Product update failed.", "error");
          return;
        }
      }

      // Local storage alignment fallback processing
      const image = file ? await fileToDataUrl(file) : product.image;
      const updated = {
        ...product,
        productName: form.elements.product_name.value.trim(),
        description: form.elements.description.value.trim(),
        category: form.elements.category_name.value,
        condition: form.elements.product_condition.value,
        mrp: Number(form.elements.mrp.value),
        sellingPrice: Number(form.elements.selling_price.value),
        quantityAvailable: Number(form.elements.quantity_available.value),
        location: form.elements.location.value.trim(),
        contactNumber: form.elements.contact_number.value.trim(),
        status: form.elements.status.value,
        image: image || FALLBACK_IMAGE
      };

      saveProducts(getProducts().map(function (item) {
        return String(item.id) === String(product.id) ? updated : item;
      }));

      setMessage(message, "Product updated locally.", "success");
      window.setTimeout(function () {
        window.location.href = "my_products.html";
      }, 700);
    });
  }

  seedData();

  window.CS = {
    addPurchase,
    apiFetch,
    bindWishlistButtons,
    confirmPurchaseRemote,
    createProduct,
    deleteProductRemote,
    escapeAttr,
    escapeHTML,
    fetchDashboard,
    fetchMyProducts,
    fetchProductById,
    fetchProducts,
    fetchProfile,
    fetchWishlistProducts,
    FALLBACK_IMAGE,
    fileToDataUrl,
    formatDate,
    formatMoney,
    getCurrentUser,
    getAuthToken,
    getParam,
    getProductById,
    getProducts,
    getPurchases,
    getUsers,
    getWishlist,
    isWishlisted,
    loginUser,
    newId,
    normalizeProduct,
    productCard,
    registerUser,
    renderProductGrid,
    saveProducts,
    saveUsers,
    setAuth,
    setCurrentUser,
    setMessage,
    toggleWishlist,
    updateProductRemote,
    updateProfileRemote
  };

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initHomeSearch();
    initDashboard();
    initProfile();
    initMyProducts();
    initEditProduct();
  });
})();