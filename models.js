// Base Class
class MenuItem {
  constructor(id, name, price, desc, tags = [], stocks = 99, image = '') { 
    this.id = id;
    this.name = name;
    this.price = price;
    this.desc = desc;
    this.tags = tags;
    this.stocks = stocks; 
    this.image = image; 
  }
}

// Inherits from MenuItem
class FoodItem extends MenuItem {
  constructor(id, name, price, desc, tags = [], stocks = 15, image = '') { 
    super(id, name, price, desc, tags, stocks, image);
  }
}

// Inherits from MenuItem, adds Drink-specific properties
class DrinkItem extends MenuItem {
  constructor(id, name, price, desc, icon, stocks = 99, image = '') { 
    super(id, name, price, desc, [], stocks, image); 
    this.icon = icon;
  }
}

// Encapsulates a finalized order
class Order {
  constructor(items, prepTime, type = 'pickup', tableIds = []) {
    this.items = items;
    this.timestamp = new Date();
    this.prepTime = prepTime;
    this.type = type;           
    this.tableIds = tableIds;   
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
    this.expiresAt = null; 
  }

  occupy() {
    this.isOccupied = true;
    this.occupiedSince = new Date(); 
    // Set 2 hours duration (2 hours * 60 mins * 60 secs * 1000 ms = 7,200,000 ms)
    this.expiresAt = new Date(this.occupiedSince.getTime() + 7200000);
  }

  free() {
    this.isOccupied = false;
    this.occupiedSince = null;
    this.expiresAt = null;
  }

  getOccupiedDurationString() {
    if (!this.expiresAt) return "";
    const diffMs = this.expiresAt - new Date();
    
    if (diffMs <= 0) return "Time limit reached";
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  }
}
