document.addEventListener("DOMContentLoaded", async function () {
  "use strict";

  const root = document.querySelector("[data-product-detail]");
  if (!root || !window.CS) {
    return;
  }

  const id = window.CS.getParam("id");
  const product = await window.CS.fetchProductById(id);

  if (!product) {
    root.innerHTML = `
      <div class="empty-state">
        <h2>Product not found</h2>
        <p class="muted">This item may have been removed.</p>
        <a class="button" href="products.html">Browse Products</a>
      </div>
    `;
    return;
  }

  const sold = product.status.toLowerCase() === "sold";

  root.innerHTML = `
    <div class="detail-media">
      <img src="${window.CS.escapeAttr(product.image)}" alt="${window.CS.escapeAttr(product.productName)}">
    </div>
    <div class="detail-panel">
      <div>
        <p class="eyebrow">${window.CS.escapeHTML(product.category)} - ${window.CS.escapeHTML(product.condition)}</p>
        <h1>${window.CS.escapeHTML(product.productName)}</h1>
        <p class="muted">${window.CS.escapeHTML(product.description)}</p>
      </div>
      <div class="product-facts">
        <span class="price-pill">${window.CS.escapeHTML(window.CS.formatMoney(product.sellingPrice))}</span>
        <span class="status-pill">MRP ${window.CS.escapeHTML(window.CS.formatMoney(product.mrp))}</span>
        <span class="status-pill">${window.CS.escapeHTML(product.status)}</span>
      </div>
      <ul class="detail-meta">
        <li><span>Seller</span><strong>${window.CS.escapeHTML(product.sellerName)}</strong></li>
        <li><span>Location</span><strong>${window.CS.escapeHTML(product.location)}</strong></li>
        <li><span>Contact</span><strong>${window.CS.escapeHTML(product.contactNumber || "Not shared")}</strong></li>
        <li><span>Listed</span><strong>${window.CS.escapeHTML(window.CS.formatDate(product.createdAt))}</strong></li>
      </ul>
      <div class="search-row">
        <a class="button" href="${product.contactNumber ? "tel:" + encodeURIComponent(product.contactNumber) : "#"}">Contact Seller</a>
        <button class="button secondary" type="button" data-confirm-purchase="${window.CS.escapeAttr(product.id)}" ${sold ? "disabled" : ""}>Confirm Purchase</button>
        <button class="wishlist-button" type="button" data-wishlist-button="${window.CS.escapeAttr(product.id)}" aria-pressed="false">Save</button>
      </div>
      <p class="form-message" data-detail-message>${sold ? "This product is already marked as sold." : ""}</p>
    </div>
  `;

  window.CS.bindWishlistButtons(root);

  const confirmButton = root.querySelector("[data-confirm-purchase]");
  const message = root.querySelector("[data-detail-message]");

  if (confirmButton) {
    confirmButton.addEventListener("click", async function () {
      try {
        await window.CS.confirmPurchaseRemote(product.id);
        confirmButton.disabled = true;
        window.CS.setMessage(message, "Purchase confirmed in MySQL. The item is now marked as sold.", "success");
      } catch (error) {
        window.CS.setMessage(message, error.message || "Purchase confirmation failed.", "error");
      }
    });
  }
});
