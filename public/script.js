document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const gallery = document.getElementById("gallery");
  const imageInput = document.getElementById("imageInput");

  // Load images from the serverless endpoint
  async function loadImages() {
    try {
      gallery.innerHTML = "<p>Loading images...</p>";

      const response = await fetch("/.netlify/functions/images");
      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Check if we got an error object
      if (result.error) {
        throw new Error(result.error);
      }

      // Check if images is an array
      if (!Array.isArray(result)) {
        throw new Error("Server didn't return an array of images");
      }

      gallery.innerHTML = "";

      if (result.length === 0) {
        gallery.innerHTML = "<p>No images found. Upload some!</p>";
        return;
      }

      result.forEach((image) => {
        const imgContainer = document.createElement("div");
        imgContainer.className = "img-container";

        const img = document.createElement("img");
        img.src = image.url;
        img.alt = image.filename || "Uploaded image";
        img.loading = "lazy";

        imgContainer.appendChild(img);
        gallery.appendChild(imgContainer);
      });
    } catch (err) {
      console.error("Error loading images:", err);
      gallery.innerHTML = `<p class="error">Error loading images: ${err.message}</p>`;
    }
  }

  // Initial image load
  loadImages();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (imageInput.files.length === 0) {
      alert("Please select an image to upload.");
      return;
    }

    const file = imageInput.files[0];
    // Basic file validation
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    // Create loading indicator
    const uploadButton = form.querySelector("button");
    const originalButtonText = uploadButton.textContent;
    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/.netlify/functions/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.id) {
        // Reload the image gallery after a successful upload
        imageInput.value = "";
        loadImages();
      } else {
        alert("Upload failed: Unknown error");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      // Reset button state
      uploadButton.disabled = false;
      uploadButton.textContent = originalButtonText;
    }
  });
});
