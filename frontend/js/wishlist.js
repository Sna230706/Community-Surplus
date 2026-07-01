document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const root = document.querySelector("[data-wishlist-page]");
  if (!root || !window.CS) {
    return;
  }

  async function render(isInitialLoad) {
    // Only show the disruptive "Loading..." state on the very first page mount
    if (isInitialLoad === true) {
      root.innerHTML = `<div class="empty-state"><p class="muted">Loading wishlist...</p></div>`;
    }
    
    let products = [];

    if (window.CS.getAuthToken()) {
      try {
        products = await window.CS.fetchWishlistProducts();
      } catch (error) {
        console.warn("Wishlist API fallback triggered.", error);
        const ids = window.CS.getWishlist();
        products = window.CS.getProducts().filter(function (product) {
          return ids.map(String).includes(String(product.id));
        });
      }
    } else {
      const ids = window.CS.getWishlist();
      products = window.CS.getProducts().filter(function (product) {
        return ids.map(String).includes(String(product.id));
      });
    }

    window.CS.renderProductGrid(root, products, {
      afterWishlistToggle: function (toggledId, isNowSaved) {
        if (!isNowSaved) {
          const card = root.querySelector(`[data-product-card="${window.CS.escapeAttr(toggledId)}"]`);
          if (card) {
            card.style.opacity = "0";
            card.style.transition = "opacity 0.2s ease-out";
            window.setTimeout(function () {
              card.remove();
              if (!root.querySelector("[data-product-card]")) {
                render(false);
              }
            }, 200);
          }
        }
      }
    });
  }

  // Trigger initial mount with true parameter flag to display loader layout safely
  render(true).catch(function (error) {
    root.innerHTML = `<div class="notice">${window.CS.escapeHTML(error.message || "Could not load wishlist.")}</div>`;
  });
});
