// ==========================================
// 1. OBSERVER PATTERN BASE CLASS
// ==========================================
class Observable {
  constructor() {
    this.observers = []; 
  }
  
  subscribe(fn) {
    this.observers.push(fn);
  }
  
  notify() {
    this.observers.forEach(fn => fn());
  }
}

// ==========================================
// 2. MANAGERS
// ==========================================
class MenuCatalog {
  constructor() {
    // Dynamic container tracking special card items
    this.specialItem = { id: 'special-item', name: "Scrambled Eggs", price: 285, stocks: 5 };

    this.categories = {
      breakfast: [
        new FoodItem('b1', "Roo's Big Breakfast", 395, "Two eggs any style, bacon rashers, grilled tomato...", ['popular'], 10),
        new FoodItem('b2', "Avocado Toast", 280, "Smashed avo, feta, cherry tomatoes...", ['vegan'], 5),
        new FoodItem('b3', "Eggs Benedict", 320, "Two poached eggs, smoked ham, hollandaise...", ['popular'], 8)
      ],
      allday: [
        new FoodItem('a1', "Roo Burger", 445, "Wagyu beef patty, aged cheddar...", ['popular'], 12),
        new FoodItem('a4', "Truffle Fries", 195, "Crispy skin-on fries tossed in truffle oil...", ['popular'], 20)
      ],
      mains: [
        new FoodItem('m1', "Seared Salmon", 585, "Pan-seared Atlantic salmon, lemon caper butter...", ['new'], 6),
        new FoodItem('m3', "Mushroom Risotto", 395, "Arborio rice, wild mushroom medley...", ['vegan', 'popular'], 7)
      ],
      sweets: [
        new FoodItem('s1', "Burnt Basque Cheesecake", 195, "Creamy, caramelized top, slightly custardy...", ['popular'], 15),
        new FoodItem('s3', "Croissant (Plain / Almond)", 120, "Buttery, flaky layers...", [], 10)
      ],
      drinks: [
        new DrinkItem('d1', "Americano", 115, "Rich espresso diluted with hot or cold water for a smooth, robust finish.", "☕", 50),
        new DrinkItem('d4', "Latte", 175, "Smooth espresso balanced with steamed milk and a light layer of foam.", "☕", 50),
        new DrinkItem('d5', "Matcha Latte", 185, "Ceremonial grade matcha, steamed milk.", "🍵", 50)
      ]
    };
  }

  // FIXED: Added cloud mapping handler that forces UI re-renders on stock changes
  updateFromCloud(newMenu) {
    Object.keys(this.categories).forEach(cat => {
      if (newMenu[cat] && newMenu[cat].length > 0) {
        this.categories[cat] = newMenu[cat];
      }
    });
    // Trigger immediate UI rendering to show live stock metrics
    if (window.app && window.app.ui) {
      window.app.ui.renderMenu(this);
    }
  }

  // FIXED: Added real-time layout adjustment engine for hardcoded special cards
  updateSpecialItem(stocksCount) {
    this.specialItem.stocks = stocksCount;
    const btn = document.getElementById('special-add-btn');
    const ctrl = document.getElementById('special-qty-ctrl');
    if (btn && ctrl) {
      if (stocksCount <= 0) {
        btn.innerHTML = "Not Available";
        btn.disabled = true;
        btn.style.cssText = "background:rgba(208,96,96,0.1); border-color:rgba(208,96,96,0.3); color:#d06060; cursor:not-allowed;";
        ctrl.style.display = "none";
      } else {
        btn.innerHTML = `<span class="plus">+</span> Add to Order`;
        btn.disabled = false;
        btn.style.cssText = "";
        ctrl.style.display = "inline-flex";
      }
    }
  }

  getSection(sectionId) {
    return this.categories[sectionId] || [];
  }

  findItemById(id) {
    const cleanId = id.split('-')[0];
    if (cleanId === 'special-item') return this.specialItem;
    for (let cat in this.categories) {
      const match = this.categories[cat].find(item => item.id === cleanId);
      if (match) return match;
    }
    return null;
  }
}

class Cart extends Observable {
  constructor() {
    super();
    this.items = {}; 
  }

  addItem(id, name, price, qty = 1) {
    if (this.items[id]) {
      this.items[id].qty += qty;
    } else {
      this.items[id] = { name, price, qty };
    }
    this.notify(); 
  }

  changeQty(id, delta) {
    if (!this.items[id]) return;
    this.items[id].qty += delta;
    if (this.items[id].qty <= 0) delete this.items[id];
    this.notify(); 
  }

  clear() {
    this.items = {};
    this.notify(); 
  }

  getTotals() {
    const totalItems = Object.values(this.items).reduce((sum, item) => sum + item.qty, 0);
    const subtotal = Object.values(this.items).reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + tax;
    const estimatedTime = (totalItems * 5) + 10; 
    
    return { totalItems, subtotal, tax, total, estimatedTime };
  }
  
  getItems() {
    return this.items; 
  }
}

class OrderQueue {
  constructor() {
    this.orders = [];
  }

  addOrder(order) {
    this.orders.push(order);
    return this.orders.length; 
  }

  getEstimatedWait(position, prepTime) {
    return (position - 1) * 15 + prepTime;
  }

  getLength() {
    return this.orders.length;
  }
}

class SeatingManager {
  constructor() {
    this.tables = [
      new CafeTable('t-s1', 'small', 4), new CafeTable('t-s2', 'small', 4), new CafeTable('t-s3', 'small', 4),
      new CafeTable('t-L1', 'large', 6), new CafeTable('t-L2', 'large', 6), new CafeTable('t-L3', 'large', 6),
      new CafeTable('t-L4', 'large', 6), new CafeTable('t-L5', 'large', 6), new CafeTable('t-L6', 'large', 6),
      new CafeTable('b1', 'bar', 1), new CafeTable('b2', 'bar', 1), new CafeTable('b3', 'bar', 1),
      new CafeTable('b4', 'bar', 1), new CafeTable('b5', 'bar', 1), new CafeTable('b6', 'bar', 1), new CafeTable('b7', 'bar', 1),
    ];
  }

  getTables() { return this.tables; }

  toggleTableStatus(id) {
    const table = this.tables.find(t => t.id === id);
    if (table) {
      if (table.isOccupied) table.free();
      else table.occupy();
    }
  }

  getAvailableCount() {
    return this.tables.filter(t => !t.isOccupied).length;
  }
}