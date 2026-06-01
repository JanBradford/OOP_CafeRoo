class UIManager {
  constructor() {
    this.preQty = {};
  }

  tagHTML(tags) {
    return tags.map(t => {
      if (t === 'popular') return `<span class="tag tag-p">★ Popular</span>`;
      if (t === 'vegan')   return `<span class="tag tag-v">🌿 Veg</span>`;
      if (t === 'new')     return `<span class="tag tag-n">✦ New</span>`;
      return '';
    }).join('');
  }

  renderMenu(menuCatalog) {
    ['breakfast','allday','mains','sweets'].forEach(sec => {
      const grid = document.getElementById('grid-' + sec);
      if (!grid) return;
      grid.innerHTML = menuCatalog.getSection(sec).map(item => this.createFoodCard(item)).join('');
    });
    const drinksGrid = document.getElementById('grid-drinks');
    if (drinksGrid) {
      drinksGrid.innerHTML = menuCatalog.getSection('drinks').map(drink => this.createDrinkCard(drink)).join('');
    }
  }

  createFoodCard(item) {
    const isAvailable = item.stocks > 0;
    const currentQty = this.preQty[item.id] || 0; 
      return`
      <div class="menu-card" data-id="${item.id}" data-tags="${item.tags.join(' ')}">
        <div class="card-top">
          <p class="item-name">${item.name}</p>
          <p class="item-price">₱${item.price}</p>
        </div>
        <p class="item-desc">${item.desc} <span style="color:var(--gold-light); display:block; margin-top:4px; font-size:11px;">${isAvailable ? `Available: ${item.stocks}` : 'NOT AVAILABLE'}</span></p>
        <div class="card-bottom">
          <div class="tags">${this.tagHTML(item.tags)}</div>
          <div class="add-wrap">
            ${isAvailable ? `
              <div class="qty-ctrl visible" id="qc-${item.id}">
                <button class="qty-btn" onclick="app.changePreQty('${item.id}', -1)">−</button>
                <span class="qty-num" id="qn-${item.id}">0</span>
                <button class="qty-btn" onclick="app.changePreQty('${item.id}', 1)">+</button>
              </div>
              <button class="add-btn" onclick="app.addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">+ Add</button>
            ` : `
              <button class="add-btn" style="background:rgba(208,96,96,0.1); border-color:rgba(208,96,96,0.3); color:#d06060; cursor:not-allowed;" disabled>Not Available</button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  createDrinkCard(drink) {
    const isAvailable = drink.stocks > 0;
    return `
      <div class="drink-card">
        <div class="drink-icon">${drink.icon}</div>
        <p class="drink-name">${drink.name}</p>
        <p class="drink-desc">${drink.desc} <span style="color:var(--gold-light); display:block; font-size:11px; margin-top:4px;">${isAvailable ? `Available: ${drink.stocks}` : 'NOT AVAILABLE'}</span></p>
        <p class="drink-price">₱${drink.price}</p>
        
        <div class="drink-options">
          <div class="drink-opt-row">
            <label>Temp</label>
            <select id="temp-${drink.id}" class="drink-select" ${!isAvailable ? 'disabled' : ''}>
              <option value="Hot">Hot</option>
              <option value="Cold">Cold</option>
            </select>
          </div>
          <div class="drink-opt-row">
            <label>Size</label>
            <select id="size-${drink.id}" class="drink-select" ${!isAvailable ? 'disabled' : ''}>
              <option value="Regular">Regular</option>
              <option value="Large">Large (+₱20)</option>
            </select>
          </div>
          <div class="drink-opt-row">
            <label>Sugar</label>
            <select id="sugar-${drink.id}" class="drink-select" ${!isAvailable ? 'disabled' : ''}>
              <option value="Regular">Regular</option>
              <option value="50%">50%</option>
              <option value="No sugar">No sugar</option>
            </select>
          </div>
          <div class="drink-opt-row">
            <label>Add-on</label>
            <select id="addon-${drink.id}" class="drink-select" ${!isAvailable ? 'disabled' : ''}>
              <option value="None">None</option>
              <option value="Espresso Shot">Espresso Shot (+₱30)</option>
              <option value="Oat Milk">Oat Milk (+₱30)</option>
            </select>
          </div>
        </div>

        <div class="drink-add-row">
          ${isAvailable ? `
            <div class="qty-ctrl visible" id="qc-${drink.id}">
                <button class="qty-btn" onclick="app.changePreQty('${drink.id}', -1)">−</button>
                <span class="qty-num" id="qn-${drink.id}">0</span>
                <button class="qty-btn" onclick="app.changePreQty('${drink.id}', 1)">+</button>
            </div>
            <button class="add-btn" onclick="app.addDrinkToCart('${drink.id}', '${drink.name.replace(/'/g, "\\'")}', ${drink.price})">+ Add</button>
          ` : `
            <button class="add-btn" style="background:rgba(208,96,96,0.1); border-color:rgba(208,96,96,0.3); color:#d06060; width:100%; justify-content:center; cursor:not-allowed;" disabled>Not Available</button>
          `}
        </div>
      </div>
    `;
  }

  updateCart(cart, queuePos, queueLen, selectedTableIds, availableCount, orderType, activeWaitTime, pickupTime) {
    const stats = cart.getTotals();
    const items = cart.getItems();
    const ids   = Object.keys(items);

    // Calculate ready time here so the HTML template below can read it safely
    const readyDate = new Date(Date.now() + stats.estimatedTime * 60000);
    const readyTimeStr = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.getElementById('cart-badge').textContent = stats.totalItems;
    document.getElementById('cart-badge').classList.toggle('show', stats.totalItems > 0);

    const queueEl = document.getElementById('queue-info');
    if (queuePos) {
      queueEl.textContent = activeWaitTime
        ? `#${queuePos} in queue · est. ${activeWaitTime} min`
        : `#${queuePos} in queue`;
    } else if (queueLen > 0) {
      queueEl.textContent = `(${queueLen} in queue)`;
    } else {
      queueEl.textContent = '';
    }

    const container = document.getElementById('cart-items');
    if (ids.length === 0) {
      container.innerHTML = `<div class="empty-cart"><div class="empty-icon">🛒</div><p>Your order is empty.<br>Add something delicious!</p></div>`;
    } else {
      container.innerHTML = ids.map(id => `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-name">${items[id].name}</p>
            <p class="cart-item-price">₱${(items[id].price * items[id].qty).toLocaleString()}</p>
          </div>
          <div class="cart-item-qty">
            <button class="ciq-btn" onclick="app.updateCartQty('${id}', -1)">−</button>
            <span class="ciq-num">${items[id].qty}</span>
            <button class="ciq-btn" onclick="app.updateCartQty('${id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }

    document.getElementById('subtotal-val').textContent = `₱${stats.subtotal.toLocaleString()}`;
    document.getElementById('tax-val').textContent      = `₱${stats.tax.toLocaleString()}`;
    document.getElementById('total-val').textContent    = `₱${stats.total.toLocaleString()}`;
    document.getElementById('estimate-val').textContent = `${stats.estimatedTime} min`;

    const seatUI = document.getElementById('seat-selection-ui');
    if (seatUI) {
      const isDineIn  = orderType === 'dine-in';
      const isPickup  = orderType === 'pickup';

      if (availableCount === 0 && !isPickup) {
        seatUI.innerHTML = `
          <div class="order-type-notice">
            <p>⚠️ All seats are currently occupied.</p>
            <button class="order-type-btn order-type-btn--active" onclick="app.setOrderType('pickup')">
              🛍️ Order for Pickup instead
            </button>
          </div>`;
      } else {
        const hasTables = selectedTableIds && selectedTableIds.length > 0 && !selectedTableIds.includes('takeout');
        const dineLabel = isDineIn && hasTables
          ? `🪑 Tables: ${selectedTableIds.join(', ')} — Edit`
          : `🪑 Dine In`;
        const pickupLabel = isPickup ? `✓ Store Pickup Selected` : `🛍️ Store Pickup`;

        seatUI.innerHTML = `
          <div class="order-type-toggle">
            <button class="order-type-btn ${isDineIn ? 'order-type-btn--active' : ''}"
                    onclick="app.setOrderType('dine-in')">
              ${dineLabel}
            </button>
            <button class="order-type-btn ${isPickup ? 'order-type-btn--active order-type-btn--pickup' : ''}"
                    onclick="app.setOrderType('pickup')">
              ${pickupLabel}
            </button>
          </div>
          ${isDineIn && (!selectedTableIds || selectedTableIds.length === 0) ? `<p class="seat-hint">👆 Select a table from the floor plan</p>` : ''}
          
          ${isPickup ? `
          <div style="margin-top: 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 12px; border: 0.5px solid var(--border);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <label style="font-size: 13px; color: var(--text-dim); font-weight: 500;">Order Timing</label>
              <select class="form-input" onchange="const isPre = this.value === 'preorder'; document.getElementById('pickup-time-row').style.display = isPre ? 'flex' : 'none'; window.setPickupTime(isPre ? '' : 'ESTIMATED');" style="background: var(--surface2); padding: 6px 10px; width: auto; font-size: 13px; border-radius: 8px; cursor:pointer;">
                <option value="estimated" ${pickupTime === 'ESTIMATED' || !pickupTime || pickupTime === 'ASAP' ? 'selected' : ''}>
                  Estimated pick up time (${readyTimeStr})
                </option>
                <option value="preorder" ${pickupTime && pickupTime !== 'ESTIMATED' && pickupTime !== 'ASAP' ? 'selected' : ''}>
                  Schedule
                </option>
              </select>
            </div>
            
            <div id="pickup-time-row" style="display: ${pickupTime && pickupTime !== 'ESTIMATED' && pickupTime !== 'ASAP' ? 'flex' : 'none'}; align-items: center; justify-content: space-between; border-top: 0.5px solid var(--border); padding-top: 10px;">
              <label style="font-size: 13px; color: var(--text-dim); font-weight: 500;">Select Time</label>
              <input type="time" class="form-input" step="600" onchange="window.setPickupTime(this.value)" value="${pickupTime && pickupTime !== 'ESTIMATED' && pickupTime !== 'ASAP' ? pickupTime : ''}" style="background: var(--surface2); padding: 6px 10px; width: auto; font-size: 13px; border-radius: 8px; color: var(--cream);">
            </div>
          </div>
          ` : ''}
        `;
      }
    }

    // THIS IS THE PART THAT WAS BROKEN! (It is now safely inside the function)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = (ids.length === 0 || !selectedTableIds || selectedTableIds.length === 0);
    }

    const placeOrderBtn = document.getElementById('real-place-order-btn');
    if (placeOrderBtn) {
      placeOrderBtn.disabled = (ids.length === 0 || !selectedTableIds || selectedTableIds.length === 0);
    }
  }

  // Change selectedTableId to selectedTableIds array
  renderSeating(seatingManager, selectedTableIds) {
    const container = document.getElementById('floor-plan');
    if (!container) return;

    const tables = seatingManager.getTables();
    const available = seatingManager.getAvailableCount();
    const total = tables.length;
    const occupied = total - available;

    const smallTables = tables.filter(t => t.type === 'small');
    const largeTables = tables.filter(t => t.type === 'large');
    const barTables = tables.filter(t => t.type === 'bar');

    const createTableHTML = (t) => {
      let statusClass = 'available';
      if (t.isOccupied) statusClass = 'occupied';
      else if (selectedTableIds && selectedTableIds.includes(t.id)) statusClass = 'selected';

      const label = t.type === 'small' ? `S${t.id.replace('t-s','')}`
                  : t.type === 'large' ? `L${t.id.replace('t-L','')}`
                  : `B${t.id.replace('b','')}`; 

      const capacityIcon = t.type === 'bar' ? '' : `<span class="time-stamp" style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.3px;color:#6B7280;opacity:0.9;">×${t.capacity}</span>`;

      return `
        <div class="table-node table-${t.type} ${statusClass}"
             onclick="app.selectTable('${t.id}')"
             title="${statusClass === 'occupied' ? `Occupied for ${t.getOccupiedDurationString()}` : statusClass === 'selected' ? 'Your table' : `Available · ${t.capacity} seats`}">
          <span class="table-id">${label}</span>
          ${t.isOccupied
            ? `<span class="time-stamp">${t.getOccupiedDurationString()}</span>`
            : (selectedTableIds.includes(t.id) ? '' : capacityIcon)
          }
        </div>`;
    };

    const statsBar = `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#374151;font-weight:700;margin-bottom:6px;">Table Status</div>
          <div style="display:flex;gap:0;border-radius:6px;overflow:hidden;height:8px;background:#F3F4F6;">
            <div style="background:#16a34a;width:${Math.round(available/total*100)}%;transition:width 0.4s;border-radius:6px 0 0 6px;"></div>
            <div style="background:#dc2626;width:${Math.round(occupied/total*100)}%;transition:width 0.4s;border-radius:0 6px 6px 0;"></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:10px;height:10px;border-radius:2px;background:#4ade80;border:1.5px solid #16a34a;flex-shrink:0;"></div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;color:#166534;font-weight:700;white-space:nowrap;">${available} open</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:10px;height:10px;border-radius:2px;background:#fca5a5;border:1.5px solid #dc2626;flex-shrink:0;"></div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;color:#991b1b;font-weight:700;white-space:nowrap;">${occupied} taken</span>
        </div>
      </div>`;

    const legend = `
      <div class="fp-legend">
        <div class="fp-legend-item"><div class="fp-legend-dot available"></div> Available</div>
        <div class="fp-legend-item"><div class="fp-legend-dot occupied"></div> Occupied</div>
        <div class="fp-legend-item"><div class="fp-legend-dot selected"></div> Your Table</div>
        <div class="fp-legend-item"><div class="fp-legend-dot bar" style="border-radius:50%"></div> Bar Stool</div>
      </div>`;

    container.innerHTML = `
      <div class="floor-plan-wrap">
        ${statsBar}
        ${legend}
        <div class="floor-texture">
          <div class="floor-plan-grid">
            <div class="fp-column">
              <div class="fp-zone-label">Window<br>Tables</div>
              ${smallTables.map(createTableHTML).join('')}
            </div>
            <div class="fp-column">
              <div class="fp-cashier">☕ Cashier · Order Pick-up</div>
              <div class="fp-zone-label">Main Dining</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                ${largeTables.map(createTableHTML).join('')}
              </div>
            </div>
            <div class="fp-column" style="align-items:center">
              <div class="fp-zone-label" style="text-align:center">Bar</div>
              ${barTables.map(createTableHTML).join('')}
            </div>
          </div>
        </div>
      </div>`;

    const seatCountBtn = document.getElementById('seat-count-btn');
    if (seatCountBtn) seatCountBtn.textContent = `${available} Seats Available`;
  }

  toggleCart(forceState) {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');
    if (drawer)  drawer.classList.toggle('open', forceState);
    if (overlay) overlay.classList.toggle('open', forceState);
  }

  toggleSeatingModal(forceState) {
    const modal   = document.getElementById('seating-modal');
    const overlay = document.getElementById('overlay');
    if (modal)   modal.classList.toggle('open', forceState);
    if (overlay) overlay.classList.toggle('open', forceState);
  }

  showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  showOrderConfirmation(summary) {
    const modal = document.getElementById('order-confirm-modal');
    if (!modal) return;
    const locationLine = summary.type === 'pickup'
      ? '🛍️ Pickup at counter'
      : `🪑 Table ${summary.table}`;
    document.getElementById('oc-queue').textContent  = `#${summary.position}`;
    document.getElementById('oc-location').textContent = locationLine;
    document.getElementById('oc-total').textContent  = `₱${summary.total.toLocaleString()}`;
    
    // FIX: Calculate time using summary.waitTime
    const readyDate = new Date(Date.now() + summary.waitTime * 60000);
    const readyTimeStr = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const timerLabel = modal.querySelector('.ocm-timer-label');
    if (timerLabel) {
      timerLabel.textContent = `Total prep time: ${summary.waitTime} mins (Ready at ${readyTimeStr})`;
      timerLabel.style.fontSize = "13px";
      timerLabel.style.color = "var(--gold-light)";
      timerLabel.style.fontStyle = "normal";
      timerLabel.style.fontWeight = "500";
    }

    modal.classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }

  hideOrderConfirmation() {
    const modal = document.getElementById('order-confirm-modal');
    if (modal) modal.classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  showQueueList() {
    let modal = document.getElementById('queue-list-modal');
    let isExisting = true;

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'queue-list-modal';
      modal.className = 'queue-list-modal';
      isExisting = false;
    }

    const orders = (window.app && window.app.queue && window.app.queue.orders) ? window.app.queue.orders : [];

    const listHTML = orders.length === 0
      ? '<div class="ql-empty">No active orders.</div>'
      : `<div class="ql-list">${orders.map((o, i) => {
          const items = Object.keys(o.items || {}).map(k => `${o.items[k].qty}× ${o.items[k].name || k}`).join('<br>');
          const ts = o.timestamp ? new Date(o.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
          
          // Grab the exact ready time mapped in placeOrder
          const readyTime = o.readyAt ? o.readyAt.getTime() : (Date.now() + (o.prepTime || 15) * 60000);

          return `<div class="ql-item">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                    <div>
                      <div class="ql-pos" style="color: var(--gold);">#${i+1} · Order</div>
                      
                      <div class="ql-meta" style="margin-top:8px;">
                        <span class="live-countdown" data-ready="${readyTime}" data-pos="${i+1}" style="font-family:'Cormorant Garamond', serif; font-size:24px; font-weight:700; color:var(--gold-light);"></span>
                        <br><span style="opacity:0.5; font-size:10px;">Ordered at ${ts}</span>
                      </div>
                      
                    </div>
                    <div>
                      <button id="q-btn-${i+1}" class="ql-item-cancel" onclick="app.cancelQueueAt(${i+1})">Cancel</button>
                    </div>
                  </div>
                  <div class="ql-items" style="margin-top:12px; border-top:0.5px solid var(--border); padding-top:12px;">${items}</div>
                </div>`;
        }).join('')}</div>`;

    modal.innerHTML = `
      <div class="ql-inner">
        <div class="ql-head">
          <h3>Current Queue (${orders.length})</h3>
          <button class="close-btn ql-close">✕</button>
        </div>
        <div class="ql-body">${listHTML}</div>
      </div>`;

    if (!isExisting) {
      document.body.appendChild(modal);
    }

    // Start the interval for all cards inside this modal
    this.startQueueTimers();

    modal.querySelector('.ql-close').addEventListener('click', () => this.hideQueueList());
  }

  startQueueTimers() {
    // Clear any existing interval to prevent duplicates
    if (this.queueListInterval) clearInterval(this.queueListInterval);
    
    this.tickQueueTimers(); // Immediate initial render so it doesn't wait 1 sec to show
    
    // Tick every second for every card
    this.queueListInterval = setInterval(() => {
      this.tickQueueTimers();
    }, 1000);
  }

  tickQueueTimers() {
    const timerEls = document.querySelectorAll('.live-countdown');
    if (timerEls.length === 0) return;

    timerEls.forEach(el => {
      const readyAt = parseInt(el.dataset.ready, 10);
      const pos = el.dataset.pos; // Grab the position we added above
      const remaining = readyAt - Date.now();
      const btn = document.getElementById(`q-btn-${pos}`); // Find the matching button

      if (remaining <= 0) {
        el.innerHTML = "✓ Ready to Pick Up/Serve";
        el.style.color = "var(--green-light)";
        
        // Transform the Cancel button into a Received button
        if (btn && btn.textContent !== 'Received') {
          btn.textContent = 'Received';
          btn.className = 'ql-item-received';
          btn.onclick = () => window.app.completeQueueAt(pos);
        }
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const pad = n => String(n).padStart(2, '0');
        
        el.innerHTML = `${pad(mins)}<em style="opacity:0.5; font-style:normal;">:</em>${pad(secs)} <span style="font-family:'Outfit', sans-serif; font-size:11px; font-weight:400; color:var(--text-dim); margin-left:4px;">remaining</span>`;
      }
    });
  }

  hideQueueList() {
    const modal = document.getElementById('queue-list-modal');
    if (modal) modal.remove();
    // Stop the timers when modal is closed to save memory
    if (this.queueListInterval) clearInterval(this.queueListInterval);
  }

  // ─── PAYMENT UI METHODS ───

  showPaymentOptions() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.classList.add('open');

    // Display Step 1 matrix options properly, hide the rest
    document.getElementById('payment-step-1').style.display = 'flex';
    document.getElementById('payment-step-2').style.display = 'none';
    document.getElementById('payment-step-3').style.display = 'none'; // Clear step 3 visibility remnants
    
    document.getElementById('payment-subtitle').textContent = "Select how you'd like to pay.";
    
    const backBtn = document.getElementById('payment-back-btn');
    backBtn.innerHTML = '← Back to Order';
    backBtn.onclick = () => {
      this.togglePaymentModal(false);
    };
  }

  showQRPayment() {
    // Display Step 2 QR layout options properly, hide the rest
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'flex';
    document.getElementById('payment-step-3').style.display = 'none'; // Clear step 3 visibility remnants
    
    document.getElementById('payment-subtitle').textContent = "Scan QR to complete payment.";
    
    const backBtn = document.getElementById('payment-back-btn');
    backBtn.innerHTML = '← Back to Options';
    backBtn.onclick = () => {
      this.showPaymentOptions();
    };
  }

  togglePaymentModal(forceState) {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.classList.toggle('open', forceState);
  }

  showCardForm() {
    // Hide initial payment options matrix
    document.getElementById('payment-step-1').style.display = 'none';
    // Hide QR Payment container if active
    document.getElementById('payment-step-2').style.display = 'none';
    
    // Reveal the hidden credit/debit card details form
    document.getElementById('payment-step-3').style.display = 'flex';
    document.getElementById('payment-subtitle').textContent = "Enter your card details.";

    // FIX: Look at window.app.cart instead of this.cart so the UI can find the total
    const stats = window.app.cart ? window.app.cart.getTotals() : { total: 0 };
    const cardTotalSpan = document.getElementById('card-pay-total');
    if (cardTotalSpan) {
      cardTotalSpan.textContent = stats.total.toLocaleString();
    }
    
    // Rewire back button functionality to return cleanly to step 1
    const backBtn = document.getElementById('payment-back-btn');
    if (backBtn) {
      backBtn.innerHTML = '← Back to Options';
      backBtn.onclick = () => {
        this.showPaymentOptions();
      };
    }

    // Wire up card input validation after the form is visible in the DOM
    if (window.app) window.app.setupPaymentValidationListeners();
  }

  showOrderReadyModal(msg) {
    const modal = document.getElementById('order-ready-modal');
    const msgEl = document.getElementById('order-ready-msg');
    if (!modal || !msgEl) return;
    
    msgEl.textContent = msg;
    modal.classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }

  hideOrderReadyModal() {
    const modal = document.getElementById('order-ready-modal');
    if (modal) modal.classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }
}