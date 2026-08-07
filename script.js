const fileInput = document.getElementById('mediaUpload');
const previewGrid = document.getElementById('previewGrid');
const galleryGrid = document.getElementById('galleryGrid');
const uploadBox = document.getElementById('uploadBox');
const fileCount = document.getElementById('fileCount');
const API_BASE = (window.__API_BASE__ || '').replace(/\/$/, '');
const buildUrl = (path) => `${API_BASE}${path}`;

const renderPreviewFiles = (files) => {
  previewGrid.innerHTML = '';

  files.forEach((file) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const label = document.createElement('div');
    label.className = 'preview-label';
    label.textContent = file.name;

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      item.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.controls = true;
      video.preload = 'metadata';
      item.appendChild(video);
    }

    item.appendChild(label);
    previewGrid.appendChild(item);
  });

  if (files.length > 0) {
    fileCount.textContent = `${files.length} file${files.length > 1 ? 's' : ''} selected`;
  } else {
    fileCount.textContent = 'No files selected';
  }
};

const renderGallery = async () => {
  if (!galleryGrid) return;

  try {
    const response = await fetch(buildUrl('/api/files'));
    const files = await response.json();

    galleryGrid.innerHTML = '';

    if (!files.length) {
      galleryGrid.innerHTML = '<div class="preview-item"><div class="preview-label">No uploaded files yet.</div></div>';
      return;
    }

    files.forEach((file) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      const label = document.createElement('div');
      label.className = 'preview-label';
      label.textContent = file.name;

      if (file.url.match(/\.(png|jpe?g|gif|webp|bmp)$/i)) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        item.appendChild(img);
      } else {
        const video = document.createElement('video');
        video.src = file.url;
        video.controls = true;
        video.preload = 'metadata';
        item.appendChild(video);
      }

      item.appendChild(label);
      galleryGrid.appendChild(item);
    });
  } catch (error) {
    galleryGrid.innerHTML = '<div class="preview-item"><div class="preview-label">Unable to load gallery.</div></div>';
  }
};

const applyCustomImages = async () => {
  try {
    const profileRes = await fetch(buildUrl('/api/profile'));
    const profileData = await profileRes.json();
    const backgroundRes = await fetch(buildUrl('/api/background'));
    const backgroundData = await backgroundRes.json();

    const profileImage = document.getElementById('profileImage');
    const avatarFallback = document.getElementById('avatarFallback');

    if (profileImage && profileData.url) {
      profileImage.src = profileData.url;
      profileImage.style.display = 'block';
      if (avatarFallback) avatarFallback.style.display = 'none';
    }

    if (backgroundData.url) {
      document.body.style.backgroundImage = `linear-gradient(rgba(3, 8, 20, 0.55), rgba(3, 8, 20, 0.85)), url('${backgroundData.url}')`;
    }
  } catch (error) {
    console.error('Image load failed', error);
  }
};

if (fileInput && previewGrid && uploadBox && fileCount) {
  fileInput.addEventListener('change', function (event) {
    const files = Array.from(event.target.files || []);
    renderPreviewFiles(files);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadBox.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadBox.classList.remove('dragover');
    });
  });

  uploadBox.addEventListener('drop', (event) => {
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    fileInput.files = event.dataTransfer.files;
    renderPreviewFiles(droppedFiles);
  });
}

renderGallery();
applyCustomImages();
setInterval(renderGallery, 5000);
setInterval(applyCustomImages, 5000);
