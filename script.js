const modal = document.getElementById("download-modal");
const openButtons = document.querySelectorAll("[data-open-download]");
const closeButtons = document.querySelectorAll("[data-close-download]");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear().toString();
}

function openModal() {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

openButtons.forEach((button) => {
  button.addEventListener("click", openModal);
});

closeButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});
