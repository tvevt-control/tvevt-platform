document.addEventListener("DOMContentLoaded", () => {

  const clickable = document.querySelectorAll("a, button");

  clickable.forEach(el => {

    el.addEventListener("click", () => {

      if (el.dataset.loading === "true") return;

      el.dataset.loading = "true";

      if (!el.dataset.originalText) {
        el.dataset.originalText = el.innerHTML;
      }

      if (el.tagName === "BUTTON") {
        el.innerHTML = "Processing...";
      } else {
        el.innerHTML = "Opening...";
      }

      el.style.opacity = "0.6";
      el.style.pointerEvents = "none";

      setTimeout(() => {
        el.innerHTML = el.dataset.originalText;
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
        el.dataset.loading = "false";
      }, 3000);

    });

  });

});
