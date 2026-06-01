class CafeController {
  constructor() {
    this.catalog = new MenuCatalog();
    this.cart = new Cart();
    this.queue = new OrderQueue();
    this.seating = new SeatingManager();
    this.ui = new UIManager();
    
    this.activeQueuePosition = null;
    this.activeQueueWait = null;
    this.selectedTableIds = []; 
    this.orderType = null; 
    
    this._queueTimerInterval = null;
    this.lastOrderTableIds = []; 
    this.lastOrderType = null;
    this.pickupTime = null; 

    this.cart.subscribe(() => {
      this.updateCartView();
    });

    this.ui.renderMenu(this.catalog);
    this.updateCartView();
  }

  updateCartView() {
    this.ui.updateCart(
      this.cart,
      this.activeQueuePosition,
      this.queue.getLength(),
      this.selectedTableIds, 
      this.seating.getAvailableCount(),
      this.orderType,
      this.activeQueueWait,
      this.pickupTime 
    );
    this.ui.renderSeating(this.seating, this.selectedTableIds); 
  }

  setPickupTime(time) {
    this.pickupTime = time;
  }

  // ─── ORDER TYPE ───
  setOrderType(type) {
    this.orderType = type; 
    if (type === 'pickup') {
      // FIX: Cleanly sets the array so Proceed to Payment validates properly
      this.selectedTableIds = ['takeout']; 
    } else {
      this.selectedTableIds = []; 
      this.ui.toggleCart(false);
      this.ui.toggleSeatingModal(true);
    }
    this.updateCartView();
  }

  // ─── CART FUNCTIONS ───
  changePreQty(id, delta) {
    const item = this.catalog.findItemById(id);
    const maxStock = item ? item.stocks : 99; 
    
    if (this.ui.preQty[id] === undefined) this.ui.preQty[id] = 0;
    
    let newQty = this.ui.preQty[id] + delta;
    this.ui.preQty[id] = Math.max(0, Math.min(maxStock, newQty)); 
    
    const el = document.getElementById('qn-' + id);
    if (el) el.textContent = this.ui.preQty[id];
  }

  updateCartQty(id, delta) {
    this.cart.changeQty(id, delta);
  }

  addToCart(id, name, price, qtyOverride = null) {
    const item = this.catalog.findItemById(id);
    
    let qtyToAdd = qtyOverride !== null ? qtyOverride : this.ui.preQty[id];
    if (qtyToAdd === 0) return; 
    if (qtyToAdd === undefined) qtyToAdd = 1;

    const currentCartQty = this.cart.items[id] ? this.cart.items[id].qty : 0;
    if (item && (currentCartQty + qtyToAdd) > item.stocks) {
      const left = item.stocks - currentCartQty;
      this.ui.showToast(`⚠️ Cannot add more! Only ${left} left available.`);
      return;
    }

    this.cart.addItem(id, name, price, qtyToAdd);
    
    const baseId = id.split('-')[0]; 
    this.ui.preQty[baseId] = 0;
    if (document.getElementById('qn-' + baseId)) {
      document.getElementById('qn-' + baseId).textContent = 0;
    }
    
    this.ui.showToast(`✓ Added ${qtyToAdd}x ${name} to order`);
  }

  addDrinkToCart(id, name, price) {
    const temp = document.getElementById('temp-' + id).value;
    const size = document.getElementById('size-' + id).value;
    const sugarLevel = document.getElementById('sugar-' + id).value;
    const addon = document.getElementById('addon-' + id).value;

    let additionalPrice = 0;
    let details = [];

    details.push(temp);
    if (size !== 'Regular') { details.push('Large'); additionalPrice += 20; }
    if (sugarLevel !== 'Regular') { details.push(sugarLevel + ' Sugar'); }
    if (addon !== 'None') {
      if (addon === 'Espresso Shot') { details.push('+Shot'); additionalPrice += 30; } 
      else if (addon === 'Oat Milk') { details.push('+Oat'); additionalPrice += 30; }
    }

    const finalPrice = price + additionalPrice;
    const formattedName = `${name} (${details.join(', ')})`;
    const uniqueId = `${id}-${details.join('-').replace(/\s+/g, '')}`;
    
    let qtyToAdd = this.ui.preQty[id];
    if (qtyToAdd === undefined || qtyToAdd === 0) qtyToAdd = 1;

    this.addToCart(uniqueId, formattedName, finalPrice, qtyToAdd);
    
    if (this.ui.preQty[id]) this.ui.preQty[id] = 0; 
    const el = document.getElementById('qn-' + id);
    if (el) el.textContent = 0;
  }

  // ─── SEATING ───
  selectTable(id) {
    const table = this.seating.getTables().find(t => t.id === id);
    if (table.isOccupied) {
      this.ui.showToast("This table is currently occupied.");
      return;
    }
    
    if (this.selectedTableIds.includes(id)) {
      this.selectedTableIds = this.selectedTableIds.filter(tId => tId !== id);
    } else {
      this.selectedTableIds.push(id);
    }

    this.orderType = 'dine-in';
    this.updateCartView();
  }

  setTakeout() {
    this.selectedTableIds = ['takeout'];
    this.orderType = 'pickup';
    this.updateCartView();
  }

  proceedToPayment() {
    if (this.selectedTableIds.length === 0) {
      this.ui.showToast("⚠️ Please select a seat or choose Pickup before ordering.");
      return;
    }
    this.ui.showPaymentOptions();
  }

  placeOrder(paymentMethod) {
    if (Object.keys(this.cart.getItems()).length === 0) return; 
    if (this.selectedTableIds.length === 0) return;

    const stats = this.cart.getTotals();
    const waitTime = this.queue.getEstimatedWait(this.queue.getLength() + 1, stats.estimatedTime);
    
    const newOrder = new Order({...this.cart.getItems()}, waitTime, this.orderType, [...this.selectedTableIds]);
    
    const waitMs = waitTime * 60000;
    newOrder.readyAt = new Date(Date.now() + waitMs);
    
    newOrder.timeoutId = setTimeout(() => {
      const msg = newOrder.type === 'pickup' 
        ? "Your order is ready for pick up at the counter!" 
        : `Your order is ready and will be served at Table ${newOrder.tableIds.join(', ')} shortly!`;
      this.ui.showOrderReadyModal(msg);
    }, waitMs);

    const queuePosition = this.queue.addOrder(newOrder); 

    if (!this.selectedTableIds.includes('takeout')) {
      this.selectedTableIds.forEach(id => this.seating.toggleTableStatus(id));
    }

    const orderSummary = {
      position: queuePosition,
      waitTime: waitTime,
      type: this.orderType,
      table: this.selectedTableIds.join(', '), 
      total: stats.total,
      paymentMethod: paymentMethod,
      pickupTime: this.pickupTime 
    };

    this.lastOrderDocId = null;
    this.lastOrderTableIds = [...this.selectedTableIds]; 
    this.lastOrderType = this.orderType;

    this.saveOrderToFirebase(orderSummary, stats, newOrder.items);

    this.cart.clear();
    this.selectedTableIds = [];
    this.orderType = null;
    this.pickupTime = null;

    this.ui.togglePaymentModal(false);
    this.ui.toggleCart(false);
    
    this.ui.showOrderConfirmation(orderSummary);
    
    if (document.getElementById('queue-list-modal')) {
      this.ui.showQueueList();
    }
  }

  saveOrderToFirebase(orderSummary, stats, items) {
    if (!window.firebaseDB || !window.dbMethods) {
      console.warn("Firebase not initialized. Order placed locally only.");
      return;
    }

    const db = window.firebaseDB;
    const { collection, addDoc, serverTimestamp } = window.dbMethods;

    addDoc(collection(db, "orders"), {
      ...orderSummary,
      items: items,
      status: 'pending',
      createdAt: serverTimestamp()
    }).then(docRef => {
      this.lastOrderDocId = docRef.id;
      console.log("Order saved to cloud with ID: ", docRef.id);
    }).catch(error => {
      console.error("Error saving order: ", error);
      this.ui.showToast("Order placed locally, but failed to sync to cloud.");
    });
  }

  cancelOrder() {
    const docIdToCancel = this.lastOrderDocId; 
    
    if (this.lastOrderTableIds && this.lastOrderType !== 'pickup') {
      this.lastOrderTableIds.forEach(id => {
        const table = this.seating.getTables().find(t => t.id === id);
        if (table && table.isOccupied) table.free();
      });
    }

    this.lastOrderDocId = null;
    this.lastOrderTableIds = null;
    this.lastOrderType = null;

    this.cart.clear();
    this.ui.togglePaymentModal(false);
    this.ui.toggleCart(false);
    this.updateCartView();
    
    if (document.getElementById('queue-list-modal')) {
      this.ui.showQueueList();
    }
    
    this.ui.showToast("Order cancelled.");

    if (docIdToCancel && window.firebaseDB && window.dbMethods) {
      const db = window.firebaseDB;
      const { doc, runTransaction, serverTimestamp } = window.dbMethods;
      runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", docIdToCancel);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) return;
        transaction.update(orderRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp()
        });
      }).catch(error => console.error("Cancel order failed: ", error));
    }
  }

  cancelQueueAt(position) {
    if (!position || !this.queue || !Array.isArray(this.queue.orders)) return;
    
    const idx = position - 1;
    if (idx < 0 || idx >= this.queue.orders.length) return;

    const orderToCancel = this.queue.orders[idx];
    
    if (orderToCancel && orderToCancel.timeoutId) {
      clearTimeout(orderToCancel.timeoutId);
    }

    if (orderToCancel && orderToCancel.tableIds && orderToCancel.type !== 'pickup') {
      orderToCancel.tableIds.forEach(id => {
        const table = this.seating.getTables().find(t => t.id === id);
        if (table && table.isOccupied) table.free(); 
      });
    }

    this.queue.orders.splice(idx, 1);
    this.updateCartView();
    this.ui.showQueueList(); 
    this.ui.showToast(`Order #${position} cancelled.`);
  }

  completeQueueAt(position) {
    if (!position || !this.queue || !Array.isArray(this.queue.orders)) return;
    
    const idx = position - 1;
    if (idx < 0 || idx >= this.queue.orders.length) return;

    const orderToComplete = this.queue.orders[idx];
    
    if (orderToComplete && orderToComplete.timeoutId) {
      clearTimeout(orderToComplete.timeoutId);
    }

    // Free up the tables since the customer has received their food
    if (orderToComplete && orderToComplete.tableIds && orderToComplete.type !== 'pickup') {
      orderToComplete.tableIds.forEach(id => {
        const table = this.seating.getTables().find(t => t.id === id);
        if (table && table.isOccupied) table.free(); 
      });
    }

    // Remove from the active queue
    this.queue.orders.splice(idx, 1);
    
    // Refresh the UI
    this.updateCartView();
    this.ui.showQueueList(); 
    this.ui.showToast(`🎉 Order #${position} completed! Table cleared.`);
  }

  setupPaymentValidationListeners() {
    const cardName = document.getElementById('card-name');
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCVV = document.getElementById('card-cvv');
    const cardConfirmBtn = document.getElementById('card-confirm-btn');

    if (!cardConfirmBtn) return;

    if (!cardName || !cardNumber || !cardExpiry || !cardCVV) {
      cardConfirmBtn.disabled = true;
      return;
    }

    const validateForm = () => {
      const isValid = cardName.value.trim().length > 0 &&
                      cardNumber.value.replace(/\s/g, '').length >= 15 &&
                      cardExpiry.value.trim().length === 5 &&
                      cardCVV.value.trim().length >= 3;
      
      cardConfirmBtn.disabled = !isValid;
    };

    const inputElements = [cardName, cardNumber, cardExpiry, cardCVV];
    inputElements.forEach(input => {
      input.removeEventListener('input', validateForm);
      input.addEventListener('input', validateForm);
    });

    validateForm();
  }
}

// Instantiate App
const app = new CafeController();
window.app = app;

window.setFilter = (tag, btn) => {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.menu-card').forEach(card => {
    if (tag === 'all') { card.style.display = ''; return; }
    const tags = card.dataset.tags || '';
    card.style.display = tags.includes(tag) ? '' : 'none';
  });
};

window.setCategory = (id, btn) => {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};

window.openCart = () => app.ui.toggleCart(true);
window.closeCart = () => app.ui.toggleCart(false);
window.clearCart = () => app.cart.clear();
window.proceedToPayment = () => app.proceedToPayment();
window.placeOrder = (method) => app.placeOrder(method);

// FIX: This binding was missing! This connects the time dropdown to your logic.
window.setPickupTime = (time) => app.setPickupTime(time);