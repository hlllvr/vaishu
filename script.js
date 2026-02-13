document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
     PAGE SWITCHING (UNCHANGED)
     =============================== */
  const showPage = id => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  };

  document.getElementById('yesBtn').onclick = () => {
    showPage('loader');
    setTimeout(() => showPage('page2'), 1200);
  };

/* ===============================
   PAGE 1 – PASSWORD GATE
   =============================== */

const passwordScreen = document.getElementById('passwordScreen');
const memoryContent = document.getElementById('memoryContent');
const enterBtn = document.getElementById('enterBtn');
const passwordInput = document.getElementById('passwordInput');
const passwordError = document.getElementById('passwordError');

if (enterBtn) {
  enterBtn.onclick = () => {
    const value = passwordInput.value.trim().toLowerCase();

    if (value === 'cornetto') {

  passwordScreen.classList.add('hidden');
  memoryContent.classList.remove('hidden');

  // Start music
  const music = document.getElementById('bgMusic');
  if (music) {
    music.currentTime = 0;
    music.volume = 0;
    music.play();

    let fade = setInterval(() => {
      if (music.volume < 0.9) {
        music.volume += 0.05;
      } else {
        clearInterval(fade);
      }
    }, 200);
  }

  // NOW start slideshow
  startCarousel();
}

  };
}


  /* ===============================
     PAGE 1 – NO BUTTON (UNCHANGED)
     =============================== */
  const noBtn = document.getElementById('noBtn');
  const zone = document.querySelector('.no-zone');

  noBtn.style.position = 'absolute';
  noBtn.style.left = '0px';
  noBtn.style.top = '0px';

  zone.addEventListener('mousemove', (e) => {
    const zoneRect = zone.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    const dx = (btnRect.left + btnRect.width / 2) - e.clientX;
    const dy = (btnRect.top + btnRect.height / 2) - e.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const dangerRadius = 120;

    if (distance < dangerRadius) {
      const angle = Math.atan2(dy, dx);
      const escapeForce = (dangerRadius - distance) * 1.2;

      let newLeft = noBtn.offsetLeft + Math.cos(angle) * escapeForce;
      let newTop  = noBtn.offsetTop  + Math.sin(angle) * escapeForce;

      newLeft = Math.max(0, Math.min(zoneRect.width - btnRect.width, newLeft));
      newTop  = Math.max(0, Math.min(zoneRect.height - btnRect.height, newTop));

      noBtn.style.left = newLeft + 'px';
      noBtn.style.top  = newTop  + 'px';
    }
  });

  /* ===============================
     PAGE 2 – DIAMOND PAINTING (64×64)
     =============================== */


  const img = document.getElementById('sourceImage');
  const canvasEl = document.getElementById('diamondCanvas');

  const GRID = 64;              // 🔴 CHANGED
  const PALETTE_SIZE = 6;
  const BRUSH_RADIUS = 4;       // 🔴 Slightly smaller for dense grid

  let palette = [];
  let selectedColorIndex = null;
  let colorUsage = [];
  let colorTotalCount = [];
  let colorFilledCount = [];



  // --- Dynamic palette extraction ---
 
function extractPaletteKMeans(data, k) {
  const pixels = [];

  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i+1], data[i+2]]);
  }

  // Random initial centroids
  let centroids = pixels
    .sort(() => 0.5 - Math.random())
    .slice(0, k)
    .map(p => [...p]);

  for (let iter = 0; iter < 6; iter++) {
    const clusters = Array.from({ length: k }, () => []);

    pixels.forEach(p => {
      let minDist = Infinity;
      let idx = 0;

      centroids.forEach((c, i) => {
        const d =
          (p[0] - c[0]) ** 2 +
          (p[1] - c[1]) ** 2 +
          (p[2] - c[2]) ** 2;
        if (d < minDist) {
          minDist = d;
          idx = i;
        }
      });

      clusters[idx].push(p);
    });

    centroids = clusters.map(cluster => {
      if (!cluster.length) return [0, 0, 0];
      const sum = cluster.reduce(
        (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
        [0, 0, 0]
      );
      return [
        Math.round(sum[0] / cluster.length),
        Math.round(sum[1] / cluster.length),
        Math.round(sum[2] / cluster.length)
      ];
    });
  }

function boostColor(rgb, satBoost = 1.25, contrast = 1.1) {
  let [r, g, b] = rgb.map(v => v / 255);

  // Convert to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Boost saturation
  s = Math.min(1, s * satBoost);

  // Convert back to RGB
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  let p = 2 * l - q;

  r = hue2rgb(p, q, h + 1/3);
  g = hue2rgb(p, q, h);
  b = hue2rgb(p, q, h - 1/3);

  // Contrast boost
  r = Math.min(1, Math.max(0, ((r - 0.5) * contrast + 0.5)));
  g = Math.min(1, Math.max(0, ((g - 0.5) * contrast + 0.5)));
  b = Math.min(1, Math.max(0, ((b - 0.5) * contrast + 0.5)));

  return `rgb(${(r*255)|0}, ${(g*255)|0}, ${(b*255)|0})`;
}


  return centroids.map(c => boostColor(c));

}


  function renderPalette() {
    const paletteEl = document.querySelector('.palette');
    paletteEl.innerHTML = '';

    palette.forEach((color, i) => {
      const dot = document.createElement('div');
      dot.className = 'color';
      dot.style.background = color;
      dot.textContent = i + 1;
      dot.onclick = () => selectedColorIndex = i;
      paletteEl.appendChild(dot);
    });
  }

function updatePaletteProgress() {
  document.querySelectorAll('.palette .color').forEach((dot, i) => {
    if (colorTotalCount[i] === 0) {
      dot.dataset.progress = 100;
      dot.title = `100% filled`;
      return;
    }

    const percent = ((colorUsage[i] / colorTotalCount[i]) * 100).toFixed(2);


    dot.dataset.progress = percent;
    dot.title = `${percent}% complete`;
  });
}



  img.onload = () => {
    const temp = document.createElement('canvas');
    temp.width = GRID;
    temp.height = GRID;
    const ctx = temp.getContext('2d');
    colorUsage = new Array(PALETTE_SIZE).fill(0);
    colorTotalCount = new Array(PALETTE_SIZE).fill(0);
    colorFilledCount = new Array(PALETTE_SIZE).fill(0);


    ctx.drawImage(img, 0, 0, GRID, GRID);
    const data = ctx.getImageData(0, 0, GRID, GRID).data;

    palette = extractPaletteKMeans(data, PALETTE_SIZE);

    renderPalette();
    canvasEl.innerHTML = '';

    for (let i = 0; i < GRID * GRID; i++) {
      const r = data[i*4], g = data[i*4+1], b = data[i*4+2];
      const idx = closestColor(r, g, b);
      colorTotalCount[idx]++;


      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = idx;


      cell.addEventListener('mouseenter', () => {
        if (selectedColorIndex === null) return;

        const x = i % GRID;
        const y = Math.floor(i / GRID);

        for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
          for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;

            const neighbor = canvasEl.children[ny * GRID + nx];
            if (
              neighbor.dataset.index == selectedColorIndex &&
              !neighbor.classList.contains('filled')
            ) {
              neighbor.classList.add('filled');
neighbor.style.background = palette[selectedColorIndex];
colorUsage[selectedColorIndex]++;
updatePaletteProgress();
            }
          }
        }
        checkCompletion();
      });

      canvasEl.appendChild(cell);
    }
  };

  function closestColor(r, g, b) {
    let min = Infinity, index = 0;
    palette.forEach((hex, i) => {
      const rgb = hex.match(/\d+/g).map(Number);
      const d = (r-rgb[0])**2 + (g-rgb[1])**2 + (b-rgb[2])**2;
      if (d < min) { min = d; index = i; }
    });
    return index;
  }

  function checkCompletion() {
  if (!canvasEl.querySelector('.cell:not(.filled)')) {
    onPaintingComplete();
  }
}

function onPaintingComplete() {
  // Disable further painting
  canvasEl.style.pointerEvents = 'none';

  // Dim background slightly
  canvasEl.classList.add('completed-dim');

  // Create Continue button if not exists
  if (!document.getElementById('continueBtn')) {
    const btn = document.createElement('button');
    btn.id = 'continueBtn';
    btn.className = 'btn primary';
    btn.textContent = 'Continue 💖';

    btn.style.marginTop = '24px';

    btn.onclick = () => {
      btn.remove();
      showCompletionModal();
    };



    canvasEl.parentElement.appendChild(btn);
  }
}

function showCompletionModal() {
  const popup = document.getElementById('paintComplete');

  popup.classList.remove('hidden');
  popup.classList.add('fade-in');

  setTimeout(() => {
    document.getElementById('asAlways').classList.remove('hidden');
  }, 500);
}
  /* ===============================
     PAGE 3 – CART (UNCHANGED)
     =============================== */

  const cart = [];
  const tabs = document.getElementById('cartTabs');
  const checkoutBtn = document.getElementById('checkoutBtn');

  document.querySelectorAll('.product button').forEach(btn => {
    btn.onclick = () => {
      const item = btn.parentElement.dataset.item;
      if (!cart.includes(item)) {
        cart.push(item);
        const tab = document.createElement('div');
        tab.className = 'cart-tab';
        tab.textContent = `1 × ${item}`;
        tabs.appendChild(tab);
      }
      if (cart.length === 3) checkoutBtn.disabled = false;
    };
  });

  checkoutBtn.onclick = () => {
    document.getElementById('paymentModal').classList.remove('hidden');
  };

  document.getElementById('kissPayment').onclick = () => {
    document.getElementById('paymentModal').classList.add('hidden');
    document.getElementById('successModal').classList.remove('hidden');
  };

/* ===============================
   PAINT COMPLETE → PAGE 3
   =============================== */

const toShopBtn = document.getElementById('toShop');

if (toShopBtn) {
  toShopBtn.onclick = () => {
  const popup = document.getElementById('paintComplete');
  const page3 = document.getElementById('page3');

  // Fade out popup
  popup.classList.add('fade-out');

  setTimeout(() => {
    popup.classList.add('hidden');
    popup.classList.remove('fade-out');

    // Switch page
    showPage('page3');

    // Fade in page 3
    page3.classList.add('fade-in');

    // Clean up animation class
    setTimeout(() => {
      page3.classList.remove('fade-in');
    }, 600);

  }, 500);
};

}

/* ===== PAGE 1 – MEMORY LANE CAROUSEL ===== */

// ===== Carousel Setup Variables =====
const slidesEl = document.getElementById('slides');
const slides = slidesEl ? slidesEl.children : [];
const totalSlides = slides.length;
const valentineButtons = document.getElementById('valentineButtons');

let currentIndex = 0;


function startCarousel() {

  if (!slidesEl || slides.length === 0) return;

  currentIndex = 0;
  slidesEl.style.transform = `translateX(0%)`;

  const carouselInterval = setInterval(() => {

    if (currentIndex < totalSlides - 1) {
      currentIndex++;
      slidesEl.style.transform = `translateX(-${currentIndex * 100}%)`;

      if (currentIndex === totalSlides - 1) {
        if (valentineButtons) {
          valentineButtons.classList.remove('hidden');
        }
        clearInterval(carouselInterval);
      }

    }

  }, 2500);

}


});




