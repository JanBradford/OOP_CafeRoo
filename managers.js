// ==========================================
// 1. OBSERVER PATTERN BASE CLASS
// ==========================================
class Observable {
  constructor() {
    this.observers = []; // List of listeners
  }
  
  // Add a listener
  subscribe(fn) {
    this.observers.push(fn);
  }
  
  // Broadcast to all listeners that data changed
  notify() {
    this.observers.forEach(fn => fn());
  }
}

// ==========================================
// 2. MANAGERS
// ==========================================
class MenuCatalog {
  constructor() {
    this.categories = {
      breakfast: [
        new FoodItem('b1', "Roo's Big Breakfast", 395, "Two eggs any style, bacon rashers, grilled tomato...", ['popular']),
        new FoodItem('b2', "Avocado Toast", 280, "Smashed avo, feta, cherry tomatoes...", ['vegan']),
        new FoodItem('b3', "Eggs Benedict", 320, "Two poached eggs, smoked ham, hollandaise...", ['popular'])
      ],
      allday: [
        new FoodItem('a1', "Roo Burger", 445, "Wagyu beef patty, aged cheddar...", ['popular']),
        new FoodItem('a4', "Truffle Fries", 195, "Crispy skin-on fries tossed in truffle oil...", ['popular'])
      ],
      mains: [
        new FoodItem('m1', "Seared Salmon", 585, "Pan-seared Atlantic salmon, lemon caper butter...", ['new']),
        new FoodItem('m3', "Mushroom Risotto", 395, "Arborio rice, wild mushroom medley...", ['vegan', 'popular'])
      ],
      sweets: [
        new FoodItem('s1', "Burnt Basque Cheesecake", 195, "Creamy, caramelized top, slightly custardy...", ['popular']),
        new FoodItem('s3', "Croissant (Plain / Almond)", 120, "Buttery, flaky layers...", [])
      ],
      drinks: [
        new DrinkItem('d1', "Espresso", 115, "Single or double shot of our house blend.", "☕"),
        new DrinkItem('d4', "Iced Latte", 175, "Espresso over ice, topped with cold milk.", "🧋"),
        new DrinkItem('d5', "Matcha Latte", 185, "Ceremonial grade matcha, steamed milk.", "🍵")
      ]
    };
  }

  getSection(sectionId) {
    return this.categories[sectionId] || [];
  }
}

// Cart inherits from Observable!
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
    this.notify(); // Tell the app the cart changed!
  }

  changeQty(id, delta) {
    if (!this.items[id]) return;
    this.items[id].qty += delta;
    if (this.items[id].qty <= 0) delete this.items[id];
    this.notify(); // Tell the app the cart changed!
  }

  clear() {
    this.items = {};
    this.notify(); // Tell the app the cart changed!
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