document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const form = document.querySelector("[data-register-form]");
  if (!form || !window.CS) {
    return;
  }

  const message = document.querySelector("[data-form-message]");
  const submitButton = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim().toLowerCase();
    const phone = form.elements.phone.value.trim();
    const location = form.elements.location.value.trim();
    const password = form.elements.password.value;
    const confirmPassword = form.elements.confirmPassword.value;

    if (password.length < 6) {
      window.CS.setMessage(message, "Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      window.CS.setMessage(message, "Passwords do not match.", "error");
      return;
    }

    // BUG FIX: Disable the submit button to prevent accidental duplicate account requests
    if (submitButton) {
      submitButton.disabled = true;
    }

    const payload = {
      name,
      email,
      phone,
      location,
      password
    };

    try {
      await window.CS.registerUser(payload);
      window.CS.setMessage(message, "Account created successfully.", "success");
      
      window.setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 500);
    } catch (error) {
      // BUG FIX: Re-enable the submit button on failure so the user can try again
      if (submitButton) {
        submitButton.disabled = false;
      }
      window.CS.setMessage(message, error.message || "Account creation failed.", "error");
    }
  });
});