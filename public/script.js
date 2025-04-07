document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const gallery = document.getElementById("gallery");
  const imageInput = document.getElementById("imageInput");

  // Load images from the serverless endpoint
  async function loadImages() {
    try {
      const response = await fetch("/.netlify/functions/images");
      const images = await response.json();
      gallery.innerHTML = "";
      images.forEach((image) => {
        const img = document.createElement("img");
        img.src = image.url;
        gallery.appendChild(img);
      });
    } catch (err) {
      console.error("Error loading images:", err);
    }
  }

  loadImages();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (imageInput.files.length === 0) {
      alert("Please select an image to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageInput.files[0]);

    try {
      const response = await fetch("/.netlify/functions/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.id) {
        // Reload the image gallery after a successful upload
        loadImages();
        imageInput.value = "";
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  });
});
