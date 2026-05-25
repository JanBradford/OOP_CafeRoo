class CafeController {
  constructor() {
    this.catalog = new MenuCatalog();
    this.cart = new Cart();
    this.queue = new OrderQueue();
    this.seating = new SeatingManager();
    this.ui = new UIManager();
    
    this.activeQueuePosition = null;
    this.activeQueueWait = null;
    this.selectedTableId = null;
    this.orderType = null; // 'dine-in' | 'pickup'
    this._queueTimerInterval = null;

    this.cart.subscribe(() => {
      this.updateCartView();
    });

    this.init();
  }

  init() {
    this.ui.renderMenu(this.catalog);
    this.updateCartView();
  }

  updateCartView() {
    this.ui.updateCart(
      this.cart,
      this.activeQueuePosition,
      this.queue.getLength(),
      this.selectedTableId,
      this.seating.getAvailableCount(),
      this.orderType,
      this.activeQueueWait
    );
    this.ui.renderSeating(this.seating, this.selectedTableId);
  }

  // ─── CART FUNCTIONS ───

  changePreQty(id, delta) {
    if (!this.ui.preQty[id]) this.ui.preQty[id] = 1;
    this.ui.preQty[id] = Math.max(1, this.ui.preQty[id] + delta);
    const el = document.getElementById('qn-' + id);
    if (el) el.textContent = this.ui.preQty[id];
  }

  addToCart(id, name, price) {
    const qty = this.ui.preQty[id] || 1;
    this.cart.addItem(id, name, price, qty);
    this.ui.preQty[id] = 1;
    if (document.getElementById('qn-' + id)) document.getElementById('qn-' + id).textContent = 1;
    this.ui.showToast(`✓ Added ${name} to order`);
  }

  addDrinkToCart(id, name, price) {
    const sugarLevel = document.getElementById('sugar-' + id).value;
    const formattedName = sugarLevel !== 'Regular' ? `${name} (${sugarLevel})` : name;
    const uniqueId = sugarLevel !== 'Regular' ? `${id}-${sugarLevel}` : id;
    this.addToCart(uniqueId, formattedName, price);
  }

  updateCartQty(id, delta) {
    this.cart.changeQty(id, delta);
  }

  // ─── ORDER TYPE ───

  setOrderType(type) {
    this.orderType = type; // 'dine-in' | 'pickup'
    if (type === 'pickup') {
      this.selectedTableId = 'takeout';
    } else {
      this.selectedTableId = null;
      this.ui.toggleCart(false);
      this.ui.toggleSeatingModal(true);
    }
    this.updateCartView();
  }

  // ─── SEATING ───

  selectTable(id) {
    const table = this.seating.getTables().find(t => t.id === id);
    if (table.isOccupied) {
      this.ui.showToast("This table is currently occupied.");
      return;
    }
    this.selectedTableId = (this.selectedTableId === id) ? null : id;
    this.orderType = 'dine-in';
    this.updateCartView();
    this.ui.toggleSeatingModal(false);
    this.ui.toggleCart(true);
  }

  setTakeout() {
    this.selectedTableId = 'takeout';
    this.orderType = 'pickup';
    this.updateCartView();
  }

  // ─── PLACE ORDER ───

  placeOrder() {
    if (!this.selectedTableId) {
      this.ui.showToast("⚠️ Please select a seat or choose Pickup before ordering.");
      return;
    }

    const stats = this.cart.getTotals();
    const newOrder = new Order({...this.cart.getItems()}, stats.estimatedTime);
    this.activeQueuePosition = this.queue.addOrder(newOrder);
    const waitTime = this.queue.getEstimatedWait(this.activeQueuePosition, stats.estimatedTime);
    this.activeQueueWait = waitTime;

    if (this.selectedTableId !== 'takeout') {
      this.seating.toggleTableStatus(this.selectedTableId);
    }

    const orderSummary = {
      position: this.activeQueuePosition,
      waitTime,
      type: this.orderType,
      table: this.selectedTableId,
      total: stats.total
    };

    // Firebase Data Transmit Call
    this.saveOrderToFirebase(orderSummary, stats, newOrder.items);

    this.cart.clear();
    this.selectedTableId = null;
    this.orderType = null;

    this.ui.toggleCart(false);
    this._startQueueCountdown(orderSummary);
    this.ui.showOrderConfirmation(orderSummary);
  }

  async saveOrderToFirebase(summary, stats, cartItems) {
    if (!window.firebaseDB || !window.dbMethods) {
      console.warn("Firebase not ready or active.");
      return;
    }

    const db = window.firebaseDB;
    const { collection, addDoc, serverTimestamp } = window.dbMethods;

    try {
      await addDoc(collection(db, "orders"), {
        queueNumber: summary.position,
        orderType: summary.type,
        tableId: summary.table,
        subtotal: stats.subtotal,
        tax: stats.tax,
        totalPaid: summary.total,
        estimatedWait: summary.waitTime,
        items: cartItems, 
        createdAt: serverTimestamp()
      });
      console.log("🎉 Secure order synchronization with Firestore complete!");
    } catch (error) {
      console.error("Error writing document to Firestore: ", error);
      this.ui.showToast("⚠️ Processed locally; cloud synchronization interrupted.");
    }
  }

  _startQueueCountdown(orderSummary) {
    if (this._queueTimerInterval) clearInterval(this._queueTimerInterval);
    let remaining = orderSummary.waitTime * 60; 

    const updateTimer = () => {
      if (remaining <= 0) {
        clearInterval(this._queueTimerInterval);
        this._queueTimerInterval = null;
        this.activeQueuePosition = null;
        this.activeQueueWait = null;
        this.ui.hideQueueBanner();
        this.updateCartView();
        this.ui.showToast("🎉 Your order is ready!");
        return;
      }
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      this.ui.updateQueueBanner(
        orderSummary.position,
        mins,
        secs,
        orderSummary.type,
        orderSummary.table
      );
      remaining--;
    };

    updateTimer();
    this._queueTimerInterval = setInterval(updateTimer, 1000);
  }
}

// Instantiate App
const app = new CafeController();

window.openCart  = () => app.ui.toggleCart(true);
window.closeCart = () => app.ui.toggleCart(false);
window.placeOrder = () => app.placeOrder();
window.clearCart  = () => app.cart.clear();

window.setCategory = (cat, btn) => {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.menu-section').forEach(s => s.style.display = 'none');
  document.getElementById(cat).style.display = 'block';
};

window.setFilter = (tag, btn) => {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.menu-card').forEach(card => {
    if (tag === 'all') { card.style.display = ''; return; }
    const tags = card.dataset.tags || '';
    card.style.display = tags.includes(tag) ? '' : 'none';
  });
};