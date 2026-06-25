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

  // BUG FIX: Check both the textual status flag AND actual remaining inventory stock levels
  const isSoldOut = product.status.toLowerCase() === "sold" || Number(product.quantityAvailable) <= 0;

  // Build a clean quantity selector layout string if stock is actively available
  let quantitySelectorHtml = "";
  if (!isSoldOut && Number(product.quantityAvailable) > 1) {
    quantitySelectorHtml = `
      <div class="quantity-select-wrapper" style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="muted" style="font-size: 0.875rem;">Qty:</span>
        <input type="number" id="purchase-quantity" name="quantity" value="1" min="1" max="${product.quantityAvailable}" step="1" 
               style="width: 60px; padding: 0.4rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-weight: bold;">
      </div>
    `;
  }

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
        <span class="status-pill">${isSoldOut ? "Sold Out" : window.CS.escapeHTML(product.status)}</span>
      </div>
      <ul class="detail-meta">
        <li><span>Seller</span><strong>${window.CS.escapeHTML(product.sellerName)}</strong></li>
        <li><span>Location</span><strong>${window.CS.escapeHTML(product.location)}</strong></li>
        <li><span>Contact</span><strong>${window.CS.escapeHTML(product.contactNumber || "Not shared")}</strong></li>
        <li><span>Stock Available</span><strong>${window.CS.escapeHTML(product.quantityAvailable)} pcs</strong></li>
        <li><span>Listed</span><strong>${window.CS.escapeHTML(window.CS.formatDate(product.createdAt))}</strong></li>
      </ul>
      
      <div class="purchase-zone" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
        ${quantitySelectorHtml}
        <div class="search-row" style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
          <a class="button" href="${product.contactNumber ? "tel:" + encodeURIComponent(product.contactNumber) : "#"}">Contact Seller</a>
          <button class="button secondary" type="button" data-confirm-purchase="${window.CS.escapeAttr(product.id)}" ${isSoldOut ? "disabled" : ""}>Confirm Purchase</button>
          <button class="wishlist-button" type="button" data-wishlist-button="${window.CS.escapeAttr(product.id)}" aria-pressed="false">Save</button>
        </div>
      </div>
      <p class="form-message" data-detail-message>${isSoldOut ? "This product is already out of stock or marked as sold." : ""}</p>
    </div>
  `;

  window.CS.bindWishlistButtons(root);

  const confirmButton = root.querySelector("[data-confirm-purchase]");
  const message = root.querySelector("[data-detail-message]");

  if (confirmButton) {
    confirmButton.addEventListener("click", async function () {
      // Pull choice from selector or fallback to single buy parameters
      const qtyInput = root.querySelector("#purchase-quantity");
      const chosenQuantity = qtyInput ? Number(qtyInput.value) : 1;

      // Validation safeguard check
      if (chosenQuantity < 1 || chosenQuantity > Number(product.quantityAvailable)) {
        window.CS.setMessage(message, "Please choose a valid purchase quantity based on available seller stock.", "error");
        return;
      }

      confirmButton.disabled = true;
      if (qtyInput) qtyInput.disabled = true;

      try {
        // BUG FIX: Capture dynamic count and push cleanly to API routes
        await window.CS.confirmPurchaseRemote(product.id, chosenQuantity);
        
        // Local state sync tracker recording
        window.CS.addPurchase(product, chosenQuantity);
        
        window.CS.setMessage(message, "Purchase confirmed in MySQL. The item inventory status has updated.", "success");
      } catch (error) {
        confirmButton.disabled = false;
        if (qtyInput) qtyInput.disabled = false;
        window.CS.setMessage(message, error.message || "Purchase confirmation failed.", "error");
      }
    });
  }
});