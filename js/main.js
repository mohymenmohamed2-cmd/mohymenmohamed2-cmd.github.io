/**
 * main.js (Patched)
 * - ربط الموقع مع Backend API (Express)
 * - استبدال localStorage/Hardcoded admin بمنطق JWT
 * - إصلاح أخطاء منطقية/تركيبية كانت تمنع التشغيل
 */

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // 0) إعدادات الاتصال بالـ Backend
  // -----------------------------
  // عدّل هذا العنوان لو رفعت السيرفر على استضافة.
  const API_BASE = window.API_BASE || 'http://localhost:4000';

  // Token (JWT) من تسجيل الدخول
  let token = sessionStorage.getItem('jwt') || localStorage.getItem('jwt') || '';

  const isAdmin = () => Boolean(token);

  const authHeaders = () => (
    token
      ? { 'Authorization': `Bearer ${token}` }
      : {}
  );

  const apiFetch = async (path, opts = {}) => {
    const url = `${API_BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...authHeaders(),
    };

    const res = await fetch(url, { ...opts, headers });
    // حاول قراءة JSON لو موجود
    let body = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      body = await res.json().catch(() => null);
    } else {
      body = await res.text().catch(() => null);
    }

    if (!res.ok) {
      const msg = (body && body.message) ? body.message : 'حدث خطأ أثناء الاتصال بالخادم';
      throw new Error(msg);
    }

    return body;
  };

  // -----------------------------
  // 1) أدوات UI
  // -----------------------------
  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  };

  const toggleLoader = (show) => {
    const loader = document.getElementById('global-loader');
    if (!loader) return;

    if (show) {
      loader.style.display = 'flex';
      loader.style.opacity = '1';
    } else {
      loader.style.opacity = '0';
      setTimeout(() => (loader.style.display = 'none'), 500);
    }
  };

  // -----------------------------
  // 2) AOS + Loader
  // -----------------------------
  if (window.AOS) {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 100 });
  }

  const hideLoader = () => {
    toggleLoader(false);
    document.body.classList.remove('loading');
  };
  
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }

  // -----------------------------
  // 3) Navbar + Progress + BackToTop
  // -----------------------------
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id], header[id]');
  const progressBar = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    if (navbar) {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }

    const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    if (progressBar) progressBar.style.width = scrolled + '%';

    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);

    let currentId = '';
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 120) currentId = sec.getAttribute('id');
    });

    navLinks.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`);
    });
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -----------------------------
  // 4) Hamburger
  // -----------------------------
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('nav-links');
  const navOverlay = document.getElementById('nav-overlay');

  const closeMenu = () => {
    if (!hamburger || !navLinksContainer || !navOverlay) return;
    hamburger.classList.remove('open');
    navLinksContainer.classList.remove('open');
    navOverlay.style.display = 'none';
    document.body.style.overflow = '';
  };

  if (hamburger && navLinksContainer && navOverlay) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinksContainer.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      navOverlay.style.display = isOpen ? 'block' : 'none';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navOverlay.addEventListener('click', closeMenu);
    navLinksContainer.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }

  // -----------------------------
  // 5) Hero Particles + Typing
  // -----------------------------
  const particlesContainer = document.getElementById('hero-particles');
  if (particlesContainer) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 5 + 2;
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        animation-duration: ${Math.random() * 10 + 8}s;
        animation-delay: ${Math.random() * 8}s;
        opacity: ${Math.random() * 0.4 + 0.1};
      `;
      particlesContainer.appendChild(p);
    }
  }

  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    const words = ['مكانياً', 'رقمياً', 'بدقة عالية', 'بتقنية GIS'];
    let wIdx = 0, cIdx = 0, deleting = false;

    const typeLoop = () => {
      const word = words[wIdx];
      typingEl.textContent = deleting ? word.slice(0, cIdx--) : word.slice(0, cIdx++);

      if (!deleting && cIdx > word.length) {
        deleting = true;
        setTimeout(typeLoop, 1800);
        return;
      }

      if (deleting && cIdx < 0) {
        deleting = false;
        wIdx = (wIdx + 1) % words.length;
        cIdx = 0;
      }

      setTimeout(typeLoop, deleting ? 60 : 110);
    };

    setTimeout(typeLoop, 1200);
  }

  // -----------------------------
  // 6) Counters
  // -----------------------------
  const counters = document.querySelectorAll('.counter');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseFloat(counter.getAttribute('data-target'));
          const isDecimal = counter.getAttribute('data-decimal') === 'true';
          const duration = 2000;
          let current = 0;
          const increment = target / (duration / 16);

          const updateCounter = () => {
            current += increment;
            if (current < target) {
              counter.innerText = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              counter.innerText = isDecimal ? target.toFixed(1) : target.toLocaleString();
            }
          };

          updateCounter();
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  // -----------------------------
  // 7) Charts
  // -----------------------------
  const initCharts = () => {
    if (!window.Chart) return;

    const sectorCanvas = document.getElementById('sectorChart');
    const trendCanvas = document.getElementById('trendChart');

    if (sectorCanvas) {
      const sectorCtx = sectorCanvas.getContext('2d');
      new Chart(sectorCtx, {
        type: 'doughnut',
        data: {
          labels: ['صناعي وبترولي', 'نقل ومواصلات', 'موانئ وبحري', 'سكني وتجاري', 'طاقة وكهرباء', 'زراعي وحرق مخلفات'],
          datasets: [{
            data: [38, 22, 16, 11, 9, 4],
            backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#64748b', '#8b5cf6', '#ef4444'],
            borderWidth: 2,
            borderColor: 'rgba(15,23,42,0.8)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', font: { family: 'Cairo', size: 13 }, padding: 15 }
            },
            tooltip: {
              callbacks: { label: (ctx) => ` ${ctx.parsed}%` }
            }
          },
          cutout: '65%'
        }
      });
    }

    if (trendCanvas) {
      const trendCtx = trendCanvas.getContext('2d');
      new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (توقع)'],
          datasets: [{
            label: 'انبعاثات CO2 (ألف طن)',
            data: [21.4, 19.8, 18.2, 17.5, 16.8, 16.2, 15.5, 14.9],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointRadius: 5,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'Cairo' } },
              border: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Cairo' } },
              border: { color: 'rgba(255,255,255,0.05)' }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  };

  initCharts();

  // -----------------------------
  // 8) Leaflet Map + Hotspots (API)
  // -----------------------------
  const defaultHotspots = [
    { lat: 31.1820, lng: 29.8630, intensity: 0.95, name: 'محطة تحيا مصر (ميناء الإسكندرية - تلوث بحري)', co2: 5800, aqi: 195 },
    { lat: 31.1180, lng: 29.8040, intensity: 0.92, name: 'شركة عز الدخيلة للصلب (صناعات ثقيلة)', co2: 5400, aqi: 185 },
    { lat: 31.0980, lng: 29.8660, intensity: 0.88, name: 'شركة ميدور (تكرير البترول)', co2: 4800, aqi: 175 },
    { lat: 31.1410, lng: 29.8370, intensity: 0.85, name: 'شركة الإسكندرية لأسمنت بورتلاند (انبعاثات غبار وCO2)', co2: 4600, aqi: 170 },
    { lat: 31.0430, lng: 29.6580, intensity: 0.82, name: 'محطة كهرباء سيدي كرير 3 و 4 (حرق وقود أحفوري)', co2: 4200, aqi: 165 },
    { lat: 31.1870, lng: 29.8730, intensity: 0.78, name: 'ترسانة الإسكندرية البحرية (صيانة وسفن)', co2: 3800, aqi: 155 },
    { lat: 31.1380, lng: 29.8480, intensity: 0.75, name: 'الإسكندرية للتكرير والبتروكيماويات (ANRPC)', co2: 3500, aqi: 145 },
    { lat: 31.0080, lng: 29.8420, intensity: 0.72, name: 'شركة البتروكيماويات المصرية (كيماويات دقيقة)', co2: 3200, aqi: 140 },
    { lat: 31.2150, lng: 29.9960, intensity: 0.65, name: 'محطة كهرباء السيوف (شرق الإسكندرية)', co2: 2800, aqi: 130 },
    { lat: 31.1380, lng: 29.8310, intensity: 0.60, name: 'شركة مصر لصناعة الكيماويات (مصانع المكس)', co2: 2400, aqi: 120 },
    { lat: 31.1270, lng: 29.8310, intensity: 0.55, name: 'شركة المكس للملاحات (منطقة صناعية)', co2: 2100, aqi: 110 },
    { lat: 31.2230, lng: 29.9940, intensity: 0.40, name: 'مصنع بسكو مصر (صناعات غذائية خفيفة)', co2: 1200, aqi: 85 }
  ];

  let currentHotspots = [];

  const getMarkerStyle = (intensity) => {
    if (intensity > 0.75) return { color: '#ef4444', radius: 1000 * intensity, fillOpacity: 0.6 };
    if (intensity > 0.50) return { color: '#f97316', radius: 700 * intensity, fillOpacity: 0.5 };
    return { color: '#10b981', radius: 400 * intensity, fillOpacity: 0.4 };
  };

  const getRiskLabel = (intensity) => {
    if (intensity > 0.75) return 'عالي';
    if (intensity > 0.50) return 'متوسط';
    return 'منخفض';
  };

  const normalizeHotspot = (s) => {
    const intensity = Number(s.emission_index ?? s.intensity);
    return {
      id: s.id ?? null,
      name: s.name,
      lat: Number(s.lat),
      lng: Number(s.lng),
      intensity,
      // استخدم القيم الحقيقية إذا موجودة، وإلا احسب تقديرياً بناءً على intensity
      co2: s.co2 ?? s.co2_value ?? Math.round(intensity * 5100),
      aqi: s.aqi ?? Math.round(40 + intensity * 160),
      created_at: s.created_at || null,
    };
  };

  const fetchHotspots = async () => {
    // كود لحذف البيانات القديمة من متصفح المستخدم تلقائياً
    localStorage.removeItem('gisHotspots');
    
    try {
      const data = await apiFetch('/api/hotspots');
      return Array.isArray(data) ? data.map(normalizeHotspot) : [];
    } catch (e) {
      // fallback local
      const local = JSON.parse(localStorage.getItem('gisHotspots') || 'null');
      const arr = Array.isArray(local) ? local : defaultHotspots;
      return arr.map(normalizeHotspot);
    }
  };

  // Create map if element exists + Leaflet loaded
  let map = null;
  const mapEl = document.getElementById('map');

  if (mapEl && window.L) {
    const alexandriaCoords = [31.2001, 29.9187];

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri', maxZoom: 19 }
    );

    const osmRoadsLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors', maxZoom: 19 }
    );

    map = L.map('map', { center: alexandriaCoords, zoom: 12, layers: [satelliteLayer], zoomControl: true });
    // إصلاح تأخر تحميل الخريطة على الموبايل
    setTimeout(() => map.invalidateSize(), 300);
    const layerControl = L.control.layers({ 'القمر الصناعي (ESRI)': satelliteLayer, 'شبكة الطرق (OSM)': osmRoadsLayer }).addTo(map);

    // Load Industrial Zones GeoJSON
    fetch('data/industrial_zones.geojson')
      .then(res => res.json())
      .then(data => {
        const industrialLayer = L.geoJSON(data, {
          style: {
            color: '#f59e0b',
            weight: 2,
            fillColor: '#f59e0b',
            fillOpacity: 0.2
          },
          onEachFeature: (feature, layer) => {
            const name = feature.properties.name || 'منطقة صناعية';
            if (feature.properties.name) {
              layer.bindPopup(
                `<div style="font-family:Cairo; font-size:14px; font-weight:bold; padding:4px 6px; direction:rtl;">${name}</div>`,
                { maxWidth: 200 }
              );
            }
          }
        });
        layerControl.addOverlay(industrialLayer, 'المناطق الصناعية (OSM)');
        industrialLayer.addTo(map); // Show by default
      })
      .catch(err => console.error('Failed to load industrial zones:', err));
  }

  const clearHotspotLayers = () => {
    if (!map || !window.L) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Circle) map.removeLayer(layer);
    });
  };

  const renderHotspots = (spots) => {
    currentHotspots = spots;

    // map layers
    if (map) {
      clearHotspotLayers();
      spots.forEach((spot) => {
        const style = getMarkerStyle(spot.intensity);
        const circle = L.circle([spot.lat, spot.lng], {
          color: style.color,
          fillColor: style.color,
          fillOpacity: style.fillOpacity,
          radius: style.radius,
          weight: 2,
        }).addTo(map);

        circle.bindPopup(
          `<div style="font-family:Cairo; text-align:right;">
             <b>${spot.name}</b><br>
             مؤشر الخطورة: ${(spot.intensity * 100).toFixed(0)}%<br>
             CO2 المُقدر: ${spot.co2} طن/سنة<br>
             AQI: ${spot.aqi}
           </div>`
        );
      });
    }

    // table
    const tableBody = document.getElementById('hotspots-table-body');
    if (tableBody) {
      tableBody.innerHTML = '';
      spots.forEach((spot, idx) => {
        const tr = document.createElement('tr');
        const riskClass = spot.intensity > 0.75 ? 'risk-high' : (spot.intensity > 0.5 ? 'risk-med' : 'risk-low');
        tr.className = riskClass + ' table-row-clickable';
        tr.setAttribute('data-risk', spot.intensity > 0.75 ? 'high' : (spot.intensity > 0.5 ? 'medium' : 'low'));
        tr.setAttribute('data-idx', idx);
        tr.title = 'اضغط لعرض الموقع على الخريطة';

        tr.innerHTML = `
          <td>
            <span class="row-map-icon"><i class="fa-solid fa-location-dot"></i></span>
            ${spot.name}
          </td>
          <td>${getRiskLabel(spot.intensity)} (${(spot.intensity * 100).toFixed(0)}%)</td>
          <td>${spot.co2 != null ? spot.co2.toLocaleString() + ' طن' : '-'}</td>
          <td><span class="aqi-badge aqi-${spot.intensity > 0.75 ? 'bad' : (spot.intensity > 0.5 ? 'mod' : 'good')}">${spot.aqi ?? '-'}</span></td>
          <td><button class="map-link-btn" title="عرض على الخريطة"><i class="fa-solid fa-map-pin"></i> عرض</button></td>
        `;

        // ✅ الضغط على الصف يفتح الخريطة ويعرض الـ popup
        tr.addEventListener('click', () => {
          if (!map) return;
          const mapSection = document.getElementById('map-section');
          if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setTimeout(() => {
            map.flyTo([spot.lat, spot.lng], 14, { duration: 1.2 });
            // ابحث عن الـ circle الخاص بهذه البؤرة وافتح popup
            map.eachLayer((layer) => {
              if (layer instanceof L.Circle) {
                const c = layer.getLatLng();
                if (Math.abs(c.lat - spot.lat) < 0.001 && Math.abs(c.lng - spot.lng) < 0.001) {
                  layer.openPopup();
                }
              }
            });
          }, 600);
        });

        tableBody.appendChild(tr);
      });
    }
  };

  // first load hotspots
  (async () => {
    const spots = await fetchHotspots();
    renderHotspots(spots);
  })();

  // -----------------------------
  // 9) Table Filter + Export CSV
  // -----------------------------
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      document.querySelectorAll('#hotspots-table-body tr').forEach((row) => {
        const risk = row.getAttribute('data-risk');
        const show = (filter === 'all') || (risk === filter);
        row.classList.toggle('hidden-row', !show);
      });
    });
  });

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const header = ['المنطقة', 'مؤشر الانبعاث', 'CO2 (طن/سنة)', 'AQI', 'Lat', 'Lng'];
      const rows = currentHotspots.map((s) => [
        `"${s.name}"`,
        (Number(s.intensity) * 100).toFixed(0) + '%',
        s.co2 ?? '-',
        s.aqi ?? '-',
        Number(s.lat).toFixed(4),
        Number(s.lng).toFixed(4),
      ]);

      const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'alexandria_emissions.csv';
      a.click();

      URL.revokeObjectURL(url);
      showToast('تم تصدير البيانات بنجاح', 'success');
    });
  }

  // -----------------------------
  // 10) Posts (API)
  // -----------------------------
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderPosts = (posts) => {
    const container = document.getElementById('posts-container');
    if (!container) return;

    container.innerHTML = '';

    if (!posts || posts.length === 0) {
      container.innerHTML = `<div class="empty-state glass-card">لا توجد تقارير منشورة بعد.</div>`;
      return;
    }

    posts.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'post-card';

      // زر حذف: مفعّل فقط لو يوجد endpoint حذف (اختياري). افتراضيًا مخفي.
      card.innerHTML = `
        <h3>${p.title}</h3>
        <div class="post-date"><i class="fa-solid fa-calendar"></i> ${formatDate(p.created_at || p.date)}</div>
        <p>${p.content}</p>
      `;

      container.appendChild(card);
    });
  };

  const loadPosts = async () => {
    try {
      const posts = await apiFetch('/api/posts');
      renderPosts(posts);
    } catch (e) {
      // fallback local (للـ demo offline)
      const local = JSON.parse(localStorage.getItem('gisPosts') || 'null');
      const demo = Array.isArray(local) ? local : [
        { id: 1, title: 'رصد ارتفاع حاد في انبعاثات منطقة برج العرب', date: new Date('2026-04-25').toISOString(), content: 'رصدت الخرائط الحرارية المحدثة ارتفاعاً بنسبة 14% في انبعاثات CO2 بمنطقة برج العرب الصناعية مقارنة بالربع الأول من 2025، ويُعزى ذلك لزيادة طاقة مصانع الأسمدة والبتروكيماويات.' },
        { id: 2, title: 'تقرير: ميناء الإسكندرية الأعلى تلوثاً بالمحافظة', date: new Date('2026-04-18').toISOString(), content: 'أكد التحليل المكاني الجديد أن منطقة الميناء تتصدر قائمة البؤر الانبعاثية بـ 5,800 طن CO2 سنوياً، مع مؤشر AQI خطير يبلغ 195 نقطة.' },
        { id: 3, title: 'مبادرة التشجير تخفض AQI في المنتزه بنسبة 8%', date: new Date('2026-04-10').toISOString(), content: 'أسفرت مبادرة تشجير الحدائق والكورنيش عن انخفاض ملموس في مؤشر جودة الهواء AQI بمنطقتي المنتزه وأبو قير.' }
      ];
      renderPosts(demo);
    }
  };

  loadPosts();

  // -----------------------------
  // 11) Admin Modal (Login + Publish + Add Hotspot)
  // -----------------------------
  const adminModal = document.getElementById('admin-modal');
  const adminTrigger = document.getElementById('admin-trigger');

  const loginStep = document.getElementById('login-step');
  const postStep = document.getElementById('post-step');

  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginError = document.getElementById('login-error');

  const tabPost = document.getElementById('tab-post');
  const tabHotspot = document.getElementById('tab-hotspot');
  const formPost = document.getElementById('form-post');
  const formHotspot = document.getElementById('form-hotspot');

  const publishBtn = document.getElementById('publish-btn');
  const addHotspotBtn = document.getElementById('add-hotspot-btn');

  const openAdmin = () => {
    if (!adminModal) return;
    adminModal.style.display = 'block';

    if (isAdmin()) {
      if (loginStep) loginStep.style.display = 'none';
      if (postStep) postStep.style.display = 'block';
    } else {
      if (loginStep) loginStep.style.display = 'block';
      if (postStep) postStep.style.display = 'none';
    }
  };

  const closeAdmin = () => {
    if (!adminModal) return;
    adminModal.style.display = 'none';
  };

  if (adminTrigger) {
    adminTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openAdmin();
    });
  }

  // Close modal
  const closeX = document.querySelector('.close-modal');
  if (closeX) closeX.addEventListener('click', closeAdmin);

  window.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdmin();
  });

  // Tabs
  if (tabPost && tabHotspot && formPost && formHotspot) {
    tabPost.addEventListener('click', () => {
      formPost.style.display = 'block';
      formHotspot.style.display = 'none';
      tabPost.classList.add('active');
      tabHotspot.classList.remove('active');
    });

    tabHotspot.addEventListener('click', () => {
      formHotspot.style.display = 'block';
      formPost.style.display = 'none';
      tabHotspot.classList.add('active');
      tabPost.classList.remove('active');
    });
  }

  // Login
  const doLogin = async () => {
    try {
      const u = document.getElementById('admin-username').value.trim();
      const p = document.getElementById('admin-password').value;

      if (!u || !p) {
        showToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
      }

      toggleLoader(true);
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password: p })
      });

      token = data.token;
      // اجعلها session فقط (أأمن) ويمكنك تغييرها إلى localStorage لو تريد
      sessionStorage.setItem('jwt', token);

      if (loginError) loginError.textContent = '';
      showToast('مرحباً! تم تسجيل الدخول بنجاح', 'success');

      if (loginStep) loginStep.style.display = 'none';
      if (postStep) postStep.style.display = 'block';

      closeAdmin();
      await loadPosts();
      const spots = await fetchHotspots();
      renderHotspots(spots);

    } catch (e) {
      if (loginError) loginError.textContent = e.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.';
      showToast('بيانات غير صحيحة', 'error');
    } finally {
      toggleLoader(false);
    }
  };

  if (loginBtn) loginBtn.addEventListener('click', doLogin);

  const passwordInput = document.getElementById('admin-password');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      token = '';
      sessionStorage.removeItem('jwt');
      localStorage.removeItem('jwt');
      showToast('تم تسجيل الخروج بنجاح', 'success');
      closeAdmin();
    });
  }

  // Publish Post
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      try {
        const t = document.getElementById('post-title').value.trim();
        const c = document.getElementById('post-content').value.trim();

        if (!t || !c) {
          showToast('يرجى ملء جميع الحقول', 'error');
          return;
        }

        toggleLoader(true);
        await apiFetch('/api/posts', {
          method: 'POST',
          body: JSON.stringify({ title: t, content: c })
        });

        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';

        showToast('تم نشر التقرير بنجاح!', 'success');
        closeAdmin();
        await loadPosts();

      } catch (e) {
        showToast(e.message || 'فشل نشر التقرير', 'error');
      } finally {
        toggleLoader(false);
      }
    });
  }

  // Add Hotspot
  if (addHotspotBtn) {
    addHotspotBtn.addEventListener('click', async () => {
      try {
        const name = document.getElementById('hotspot-name').value.trim();
        const lat = parseFloat(document.getElementById('hotspot-lat').value);
        const lng = parseFloat(document.getElementById('hotspot-lng').value);
        const intensity = parseFloat(document.getElementById('hotspot-intensity').value);

        if (!name || Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(intensity)) {
          showToast('يرجى ملء جميع الحقول بشكل صحيح', 'error');
          return;
        }

        if (intensity < 0 || intensity > 1) {
          showToast('مؤشر الانبعاث يجب أن يكون بين 0 و 1', 'error');
          return;
        }

        // نطاق تقريبي للإسكندرية
        if (lat < 30 || lat > 32 || lng < 28 || lng > 32) {
          showToast('الإحداثيات خارج نطاق الإسكندرية', 'error');
          return;
        }

        toggleLoader(true);

        // لو فيه Token هنضيفها عبر الـ API، وإلا نخزن محليًا (ديمو)
        if (isAdmin()) {
          await apiFetch('/api/hotspots', {
            method: 'POST',
            body: JSON.stringify({ name, lat, lng, intensity })
          });
        } else {
          const local = JSON.parse(localStorage.getItem('gisHotspots') || 'null');
          const arr = Array.isArray(local) ? local : defaultHotspots;
          arr.push({ name, lat, lng, intensity });
          localStorage.setItem('gisHotspots', JSON.stringify(arr));
        }

        document.getElementById('hotspot-name').value = '';
        document.getElementById('hotspot-lat').value = '';
        document.getElementById('hotspot-lng').value = '';
        document.getElementById('hotspot-intensity').value = '';

        const spots = await fetchHotspots();
        renderHotspots(spots);

        showToast(`تمت إضافة بؤرة "${name}" للخريطة`, 'success');
        closeAdmin();

        if (map) map.flyTo([lat, lng], 13, { duration: 1.5 });

      } catch (e) {
        showToast(e.message || 'فشل إضافة البؤرة', 'error');
      } finally {
        toggleLoader(false);
      }
    });
  }

});
