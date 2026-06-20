document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const root = document.querySelector("[data-wishlist-page]");
  if (!root || !window.CS) {
    return;
  }

  async function render() {
    root.innerHTML = `<div class="empty-state"><p class="muted">Loading wishlist from MySQL...</p></div>`;
    let products = [];

    if (window.CS.getAuthToken()) {
      products = await window.CS.fetchWishlistProducts();
    } else {
      const ids = window.CS.getWishlist();
      products = window.CS.getProducts().filter(function (product) {
        return ids.map(String).includes(String(product.id));
      });
    }

    window.CS.renderProductGrid(root, products);
    window.CS.bindWishlistButtons(root, render);
  }

  render().catch(function (error) {
    root.innerHTML = `<div class="notice">${window.CS.escapeHTML(error.message || "Could not load wishlist.")}</div>`;
  });
});
