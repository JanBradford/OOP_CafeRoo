// Base Class
class MenuItem {
  constructor(id, name, price, desc, tags = [], stocks = 99) { // FIXED: Added default stocks parameter
    this.id = id;
    this.name = name;
    this.price = price;
    this.desc = desc;
    this.tags = tags;
    this.stocks = stocks; 
  }
}

// Inherits from MenuItem
class FoodItem extends MenuItem {
  constructor(id, name, price, desc, tags = [], stocks = 15) { // FIXED: Pass stocks parameter up to super
    super(id, name, price, desc, tags, stocks);
  }
}

// Inherits from MenuItem, adds Drink-specific properties
class DrinkItem extends MenuItem {
  constructor(id, name, price, desc, icon, stocks = 99) { // FIXED: Pass stocks parameter up to super
    super(id, name, price, desc, [], stocks); 
    this.icon = icon;
  }
}

// Encapsulates a finalized order
class Order {
  constructor(items, prepTime, type = 'pickup', tableIds = []) {
    this.items = items;
    this.timestamp = new Date();
    this.prepTime = prepTime;
    this.type = type;           // NEW: Track if it's pickup or dine-in
    this.tableIds = tableIds;   // NEW: Track exactly which tables this order is holding
  }
}

// Encapsulates a physical table/seat in the cafe
class CafeTable {
  constructor(id, type, capacity) {
    this.id = id;
    this.type = type;         
    this.capacity = capacity;
    this.isOccupied = false;
    this.occupiedSince = null; 
  }

  occupy() {
    this.isOccupied = true;
    this.occupiedSince = new Date(); 
  }

  free() {
    this.isOccupied = false;
    this.occupiedSince = null;
  }

  // REPLACED: getOccupiedTimeString() is now getOccupiedDurationString()
  getOccupiedDurationString() {
    if (!this.occupiedSince) return "";
    const diffMs = new Date() - this.occupiedSince;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
}