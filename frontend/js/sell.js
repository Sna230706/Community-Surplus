document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const form = document.querySelector("[data-sell-form]");
  if (!form || !window.CS) {
    return;
  }

  const message = document.querySelector("[data-form-message]");
  const user = window.CS.getCurrentUser();
  const submitButton = form.querySelector("button[type='submit']");

  if (!user) {
    window.CS.setMessage(message, "Log in before adding a product.", "error");
    form.querySelectorAll("input, select, textarea, button").forEach(function (control) {
      control.disabled = true;
    });
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    
    // Prevent multiple quick clicks from submitting duplicate products
    if (submitButton) submitButton.disabled = true;

    const file = form.elements.image.files[0];

    // BUG FIX: Switch from standard JSON text objects to native multi-part FormData constructor
    const formData = new FormData();
    formData.append("seller_id", user.user_id || user.id);
    formData.append("product_name", form.elements.product_name.value.trim());
    formData.append("description", form.elements.description.value.trim());
    formData.append("category_name", form.elements.category_name.value);
    formData.append("product_condition", form.elements.product_condition.value);
    formData.append("mrp", form.elements.mrp.value);
    formData.append("selling_price", form.elements.selling_price.value);
    formData.append("quantity_available", form.elements.quantity_available.value);
    formData.append("location", form.elements.location.value.trim());
    formData.append("contact_number", form.elements.contact_number.value.trim());
    
    // Check if file is provided, otherwise let backend drop back to its safe default path rules
    if (file) {
      formData.append("image", file);
    }

    try {
      // Passes the FormData object cleanly into your optimized app.js network controller
      await window.CS.createProduct(formData);
      window.CS.setMessage(message, "Product added to MySQL marketplace.", "success");
      form.reset();
      
      window.setTimeout(function () {
        window.location.href = "my_products.html";
      }, 700);
    } catch (error) {
      if (submitButton) submitButton.disabled = false;
      window.CS.setMessage(message, error.message || "Product save failed.", "error");
    }
  });
});