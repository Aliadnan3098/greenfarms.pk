/**
 * GREENFARMS. — Interactive Web Application Engine
 * Heritage Organic Dairy • Pure Desi Ghee Made From Butter (Est. 2006)
 * Strictly 500g Premium Plastic Jars • Clean Code (Zero Emojis)
 */

// Cart State Manager
const GreenFarmsCart = {
  items: [],
  promoDiscount: 0,
  promoCode: '',

  init() {
    try {
      const saved = localStorage.getItem('greenfarms_cart');
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cart', e);
      this.items = [];
    }
    this.render();
    this.bindEvents();
  },

  save() {
    try {
      localStorage.setItem('greenfarms_cart', JSON.stringify(this.items));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  },

  addItem(product) {
    const existing = this.items.find(i => i.id === product.id && i.weight === product.weight);
    if (existing) {
      existing.qty += (product.qty || 1);
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        weight: product.weight,
        price: product.price,
        image: product.image || 'assets/images/ghee-jar.jpg',
        qty: product.qty || 1
      });
    }
    this.save();
    this.render();
    showToast(`Added ${product.name} (${product.weight}) to your cart.`);
    openCart();
  },

  updateQty(index, change) {
    if (!this.items[index]) return;
    this.items[index].qty += change;
    if (this.items[index].qty <= 0) {
      this.items.splice(index, 1);
      showToast('Item removed from cart.');
    }
    this.save();
    this.render();
  },

  removeItem(index) {
    if (this.items[index]) {
      this.items.splice(index, 1);
      this.save();
      this.render();
      showToast('Item removed from cart.');
    }
  },

  clear() {
    this.items = [];
    this.save();
    this.render();
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  getShippingCost() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 3000 ? 0 : 250; // Free delivery on orders of PKR 3,000+ (2 or more 500g jars)
  },

  getTotal() {
    const subtotal = this.getSubtotal();
    const shipping = this.getShippingCost();
    const discount = (subtotal * this.promoDiscount);
    return Math.max(0, subtotal - discount + shipping);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  },

  render() {
    const count = this.getCount();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });

    const listContainer = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-view');
    const footerContainer = document.getElementById('cart-footer-view');

    if (!listContainer) return;

    if (this.items.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (footerContainer) footerContainer.style.display = 'none';
      this.updateShippingMeter(0);
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (footerContainer) footerContainer.style.display = 'block';

    let html = '';
    this.items.forEach((item, index) => {
      html += `
        <div class="cart-item-row">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="cart-item-weight">${item.weight} &bull; PKR ${item.price.toLocaleString()}</div>
            <div class="cart-qty-ctrls">
              <button class="cart-qty-btn" onclick="GreenFarmsCart.updateQty(${index}, -1)" aria-label="Decrease quantity">&minus;</button>
              <span class="cart-qty-val">${item.qty}</span>
              <button class="cart-qty-btn" onclick="GreenFarmsCart.updateQty(${index}, 1)" aria-label="Increase quantity">&plus;</button>
            </div>
          </div>
          <div class="cart-item-price">
            PKR ${(item.price * item.qty).toLocaleString()}
          </div>
        </div>
      `;
    });
    listContainer.innerHTML = html;

    const subtotal = this.getSubtotal();
    const shipping = this.getShippingCost();
    const total = this.getTotal();

    const subtotalEl = document.getElementById('cart-subtotal-val');
    const shippingEl = document.getElementById('cart-shipping-val');
    const totalEl = document.getElementById('cart-grand-total-val');

    if (subtotalEl) subtotalEl.textContent = `PKR ${subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `PKR ${shipping}`;
    if (totalEl) totalEl.textContent = `PKR ${total.toLocaleString()}`;

    this.updateShippingMeter(subtotal);
  },

  updateShippingMeter(subtotal) {
    const meter = document.getElementById('shipping-progress');
    const text = document.getElementById('shipping-meter-text');
    if (!meter || !text) return;

    const threshold = 3000;
    if (subtotal >= threshold) {
      meter.style.width = '100%';
      text.innerHTML = '<strong>Unlocked: FREE Nationwide Express Delivery</strong>';
    } else {
      const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
      meter.style.width = `${pct}%`;
      const diff = threshold - subtotal;
      text.innerHTML = `Add <strong>PKR ${diff.toLocaleString()}</strong> more for <strong>FREE Nationwide Express Delivery</strong>`;
    }
  },

  bindEvents() {
    document.querySelectorAll('.js-cart-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
      });
    });

    const closeBtn = document.getElementById('cart-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    const backdrop = document.getElementById('cart-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeCart);
  }
};

// UI Drawer Helpers
function openCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

// Toast notification (Zero Emojis)
function showToast(msg) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#144528" stroke-width="2.5" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${msg}</span>
  `;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Direct WhatsApp Order Generator (Zero Emojis)
function sendWhatsAppOrder(customDetails = null) {
  const phone = '923332271313';
  let message = '';

  if (customDetails) {
    message = encodeURIComponent(customDetails);
  } else if (GreenFarmsCart.items.length > 0) {
    let orderLines = GreenFarmsCart.items.map(item => `* ${item.name} (${item.weight}) x ${item.qty} = PKR ${(item.price * item.qty).toLocaleString()}`).join('\n');
    let subtotal = GreenFarmsCart.getSubtotal();
    let shipping = GreenFarmsCart.getShippingCost() === 0 ? 'FREE' : `PKR ${GreenFarmsCart.getShippingCost()}`;
    let total = GreenFarmsCart.getTotal();

    let text = `Salam GreenFarms.\nI would like to place an order for Pure Desi Ghee (500g Premium Plastic Jars):\n\n${orderLines}\n\nSubtotal: PKR ${subtotal.toLocaleString()}\nDelivery: ${shipping}\nTotal Payable: PKR ${total.toLocaleString()}\nPayment Method: Cash On Delivery (COD)\n\nPlease confirm dispatch details.`;
    message = encodeURIComponent(text);
  } else {
    message = encodeURIComponent(`Salam GreenFarms. I would like to order Pure Desi Ghee in 500g Premium Plastic Jars. Please share delivery details.`);
  }

  const url = `https://wa.me/${phone}?text=${message}`;
  window.open(url, '_blank');
}

// Quick Buy Variant helper
function quickAddAndCheckout(name, weight, price, image = 'assets/images/ghee-jar.jpg') {
  GreenFarmsCart.addItem({
    id: `gf-500g-${weight.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    name: name,
    weight: weight,
    price: price,
    image: image,
    qty: 1
  });
}

// COD Checkout Modal Controller
const CODCheckout = {
  open() {
    closeCart();
    const modal = document.getElementById('cod-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      this.updateSummary();
    }
  },

  close() {
    const modal = document.getElementById('cod-modal');
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  },

  updateSummary() {
    const summaryList = document.getElementById('cod-summary-list');
    const totalEl = document.getElementById('cod-total-amount');
    if (!summaryList || !totalEl) return;

    if (GreenFarmsCart.items.length === 0) {
      summaryList.innerHTML = '<p style="color:#777;">Your cart is empty.</p>';
      totalEl.textContent = 'PKR 0';
      return;
    }

    let html = '';
    GreenFarmsCart.items.forEach(item => {
      html += `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem;">
          <span>${item.name} (${item.weight}) x ${item.qty}</span>
          <strong>PKR ${(item.price * item.qty).toLocaleString()}</strong>
        </div>
      `;
    });

    const shipping = GreenFarmsCart.getShippingCost();
    html += `
      <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:8px; border-top:1px solid #e0e0e0; font-size:0.95rem; color:#144528;">
        <span>Nationwide Delivery:</span>
        <strong>${shipping === 0 ? 'FREE' : 'PKR ' + shipping}</strong>
      </div>
    `;

    summaryList.innerHTML = html;
    totalEl.textContent = `PKR ${GreenFarmsCart.getTotal().toLocaleString()}`;
  },

  submit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.customer_name.value.trim();
    const phone = form.customer_phone.value.trim();
    const address = form.customer_address.value.trim();
    const city = form.customer_city.value.trim();

    if (!name || !phone || !address || !city) {
      alert('Please fill in your complete delivery details.');
      return;
    }

    const orderId = 'GF-' + Math.floor(100000 + Math.random() * 900000);
    const total = GreenFarmsCart.getTotal();

    const modalBody = document.getElementById('cod-modal-content');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
          <div style="width:72px; height:72px; background:#eef5f0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:20px; color:#144528;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style="display:block; font-size:0.8125rem; letter-spacing:0.12em; text-transform:uppercase; color:#144528; font-weight:700; margin-bottom:8px;">Order Confirmed &bull; Cash on Delivery</span>
          <h2 style="font-family:'Abril Fatface', serif; font-size:2.25rem; color:#0d0d0d; margin-bottom:12px;">Shukriya, ${name}</h2>
          <p style="color:#555; max-width:440px; margin:0 auto 24px; font-size:1.05rem; line-height:1.6;">
            Your Pure Desi Ghee order <strong>#${orderId}</strong> is received. Our dispatch team will pack your 500g premium plastic jars and deliver to <strong>${city}</strong> within 2 to 3 business days.
          </p>

          <div style="background:#f8f9f8; border-radius:16px; padding:20px; max-width:460px; margin:0 auto 28px; text-align:left; border:1px solid #e0e4e0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#666;">Order Number:</span>
              <strong>#${orderId}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#666;">Delivery Address:</span>
              <span style="text-align:right; max-width:240px;">${address}, ${city}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#666;">Contact / WhatsApp:</span>
              <strong>${phone}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px dashed #ccc; font-size:1.15rem;">
              <span style="font-weight:700; color:#0d0d0d;">Total Due at Doorstep:</span>
              <span style="font-family:'Abril Fatface', serif; color:#144528;">PKR ${total.toLocaleString()}</span>
            </div>
          </div>

          <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
            <button onclick="sendOrderReceiptWhatsApp('${orderId}', '${name}', '${phone}', '${address}', '${city}', ${total})" class="btn btn-primary" style="width:100%;">
              Send Confirmation on WhatsApp
            </button>
            <button onclick="CODCheckout.close(); location.reload();" class="btn btn-secondary" style="width:100%;">
              Continue Browsing
            </button>
          </div>
        </div>
      `;
    }

    GreenFarmsCart.clear();
  }
};

function sendOrderReceiptWhatsApp(orderId, name, phone, address, city, total) {
  const text = `Salam GreenFarms.\nI have placed a Cash on Delivery order on your website:\n\nOrder ID: #${orderId}\nName: ${name}\nPhone: ${phone}\nAddress: ${address}, ${city}\nPackaging: 500g Premium Plastic Jars\nTotal Amount (COD): PKR ${total.toLocaleString()}\n\nPlease dispatch my pure butter-churned ghee. Thank you.`;
  const url = `https://wa.me/923332271313?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// Lab Modal Controller
const LabModal = {
  open() {
    const modal = document.getElementById('lab-cert-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  },
  close() {
    const modal = document.getElementById('lab-cert-modal');
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }
};

// FAQ Accordion
function initFAQ() {
  document.querySelectorAll('.faq-trigger, .faq-question-btn').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = trigger.closest('.faq-item');
      if (!parent) return;
      const wasOpen = parent.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('is-open'));
      if (!wasOpen) {
        parent.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// Product Size Selector on Grand Showcase
function initProductSizeSelector() {
  const buttons = document.querySelectorAll('.js-size-btn');
  const priceDisplay = document.getElementById('featured-price-val');
  const weightDisplay = document.getElementById('featured-weight-val');
  const buyBtn = document.getElementById('featured-buy-btn');
  const waBtn = document.getElementById('featured-wa-btn');

  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const weight = btn.getAttribute('data-weight');
      const price = parseInt(btn.getAttribute('data-price'), 10);
      const title = btn.getAttribute('data-title') || 'Pure Desi Ghee (500g Premium Plastic Jar)';

      if (priceDisplay) priceDisplay.textContent = `PKR ${price.toLocaleString()}`;
      if (weightDisplay) weightDisplay.textContent = `${weight} Sealed Premium Plastic Jar`;

      if (buyBtn) {
        buyBtn.onclick = () => {
          quickAddAndCheckout(title, weight, price);
        };
      }

      if (waBtn) {
        waBtn.onclick = () => {
          const msg = `Salam GreenFarms. I would like to order ${title} (${weight}) for PKR ${price.toLocaleString()}. Please arrange delivery.`;
          sendWhatsAppOrder(msg);
        };
      }
    });
  });
}

// Full-Screen Mobile Menu Navigation Toggle
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-menu-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('mobile-nav-close');
  const backdrop = document.getElementById('cart-backdrop');

  function openMobileNav() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openMobileNav);
  if (closeBtn) closeBtn.addEventListener('click', closeMobileNav);

  // Close menu when clicking on any navigation link inside
  if (drawer) {
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });
  }
}

// Sticky header scroll behavior
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }, { passive: true });
}

// Contact & Wholesale Inquiry Form Handler
function handleContactSubmit(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inq_name')?.value || '';
  const phone = document.getElementById('inq_phone')?.value || '';
  const city = document.getElementById('inq_city')?.value || '';
  const type = document.getElementById('inq_type')?.value || 'General Inquiry';
  const msg = document.getElementById('inq_msg')?.value || '';

  showToast(`Thank you, ${name}. Your inquiry has been received.`);
  
  const waText = encodeURIComponent(`Salam GreenFarms. My name is ${name} from ${city} (${phone}). Inquiry regarding ${type}: ${msg}`);
  const waUrl = `https://wa.me/923332271313?text=${waText}`;

  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 1000);

  const form = document.getElementById('contact-form');
  if (form) form.reset();
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  GreenFarmsCart.init();
  initFAQ();
  initProductSizeSelector();
  initMobileMenu();
  initScrollHeader();
});
