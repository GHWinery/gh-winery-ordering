// ============================================================
// Supply Catalog Data
// ============================================================

const CATEGORY_TEAM_MAP = {
    'Wine': 'distribution',
    'Packaging': 'supplies',
    'Tasting Room': 'supplies',
    'Cleaning': 'supplies',
    'Office': 'supplies',
    'Bar Supplies': 'supplies'
};

const TEAM_STATUSES = {
    distribution: ['pending', 'packed', 'out_for_delivery', 'delivered'],
    supplies: ['pending', 'ordered', 'out_for_delivery', 'delivered']
};

const STATUS_LABELS = {
    pending: 'Pending',
    packed: 'Packed',
    ordered: 'Items Ordered',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered'
};

const ORDER_STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    in_progress: 'In Progress',
    completed: 'Completed',
    archived: 'Archived'
};

function getNextStatus(team, currentStatus) {
    const statuses = TEAM_STATUSES[team];
    const idx = statuses.indexOf(currentStatus);
    if (idx < 0 || idx >= statuses.length - 1) return null;
    return statuses[idx + 1];
}

// Full supply catalog — item name, category, unit, and which locations carry it
const SUPPLY_CATALOG = [
    // ===== Wine =====
    { item_name: 'Merlot Reserve', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Cabernet Reserve', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Greenhouse Red', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Sinfandel', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Chambourcin', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Noir', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Rich', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Dan', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Chardonnay', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Pinot Grigio', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Vidal', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'GH White', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Riesling', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Frascati', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Hoe', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Tramp', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Skinny Hoe', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Fredonia', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'April', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Niagara Celebration', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Diamond', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Niagara', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Concord', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Pom', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Roll in the Hay', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Ring of Fire', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Lost Vintage', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Big Hoe', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Big Dan', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Pink', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Harvest Moon', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'GH Cheer', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Razzling', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Diamond Crush', category: 'Wine', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },

    // ===== Packaging =====
    { item_name: '3 Bottle Boxes', category: 'Packaging', unit: 'bundles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: '4 Bottle Boxes', category: 'Packaging', unit: 'bundles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: '6 Bottle Boxes', category: 'Packaging', unit: 'bundles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Single Bottle Bags', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Double Bottle Bags', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Florist Bags', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Large Brown Bags', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Brown Envelopes (Deposits)', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Shrink Bags', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'White Handle Gift Bags', category: 'Packaging', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Shipping Boxes/Supplies', category: 'Packaging', unit: 'units', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Shipping Packing Tape', category: 'Packaging', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Scotch Tape', category: 'Packaging', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },

    // ===== Tasting Room =====
    { item_name: 'Cups', category: 'Tasting Room', unit: 'sleeves', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Lids', category: 'Tasting Room', unit: 'sleeves', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Straws', category: 'Tasting Room', unit: 'boxes', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Tasting Cups', category: 'Tasting Room', unit: 'sleeves', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'GH Glasses', category: 'Tasting Room', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Gift Boxes for Glasses', category: 'Tasting Room', unit: 'units', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'GH Gift Cards', category: 'Tasting Room', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'GH Stickers', category: 'Tasting Room', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Baskets', category: 'Tasting Room', unit: 'units', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Basket Food', category: 'Tasting Room', unit: 'units', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Artificial Flowers', category: 'Tasting Room', unit: 'bunches', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Ribbon', category: 'Tasting Room', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Stretchy Cord', category: 'Tasting Room', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },

    // ===== Cleaning =====
    { item_name: 'All-Purpose Cleaner', category: 'Cleaning', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Bathroom Towels', category: 'Cleaning', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Dish Soap', category: 'Cleaning', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Hand Soap', category: 'Cleaning', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Garbage Bags', category: 'Cleaning', unit: 'boxes', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Kleenex', category: 'Cleaning', unit: 'boxes', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Paper Towels', category: 'Cleaning', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Toilet Paper', category: 'Cleaning', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Toilet Bowl Cleaner', category: 'Cleaning', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Wet Mopping Cloths', category: 'Cleaning', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'White Trash Bags', category: 'Cleaning', unit: 'boxes', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Windex', category: 'Cleaning', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Latex Gloves (All Sizes)', category: 'Cleaning', unit: 'boxes', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },

    // ===== Office =====
    { item_name: 'Label Ink', category: 'Office', unit: 'cartridges', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Label Maker Labels', category: 'Office', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Pipe Cleaners', category: 'Office', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'POS Receipt Paper Rolls', category: 'Office', unit: 'rolls', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },

    // ===== Bar Supplies =====
    { item_name: 'Slushie Mix (Jugs)', category: 'Bar Supplies', unit: 'jugs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Slushie Mix (Retail)', category: 'Bar Supplies', unit: 'units', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Maraschino Cherries', category: 'Bar Supplies', unit: 'jars', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Tonic Water', category: 'Bar Supplies', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Club Soda', category: 'Bar Supplies', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Water Bottles', category: 'Bar Supplies', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Mint Leaves', category: 'Bar Supplies', unit: 'bunches', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Sprig Rosemary', category: 'Bar Supplies', unit: 'bunches', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Lemons', category: 'Bar Supplies', unit: 'each', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Limes', category: 'Bar Supplies', unit: 'each', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Oranges', category: 'Bar Supplies', unit: 'each', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Grenadine', category: 'Bar Supplies', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Napkins', category: 'Bar Supplies', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Cinnamon Sticks', category: 'Bar Supplies', unit: 'packs', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Ginger Beer', category: 'Bar Supplies', unit: 'cases', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Pineapple Juice', category: 'Bar Supplies', unit: 'bottles', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
    { item_name: 'Gallon Bags (Ziploc)', category: 'Bar Supplies', unit: 'boxes', available_at: ['Main Winery', 'Jacktown', 'Westmoreland'] },
];

// Get catalog items for a specific location, grouped by category
function getCatalogForLocation(location) {
    const items = SUPPLY_CATALOG.filter(item => item.available_at.includes(location));
    const grouped = {};
    for (const item of items) {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    }
    return grouped;
}

// Category display order
const CATEGORY_ORDER = ['Wine', 'Packaging', 'Tasting Room', 'Cleaning', 'Office', 'Bar Supplies'];

// Load product URLs and suppliers from Supabase and merge into in-memory catalog
async function loadCatalogUrls() {
    try {
        const { data, error } = await db
            .from('supply_catalog')
            .select('item_name, category, unit, available_at, product_url, supplier, stock_status');
        if (error || !data) return;
        for (const row of data) {
            const item = SUPPLY_CATALOG.find(i => i.item_name === row.item_name && i.category === row.category);
            if (item) {
                if (row.product_url) item.product_url = row.product_url;
                if (row.supplier) item.supplier = row.supplier;
                if (row.stock_status) item.stock_status = row.stock_status;
                if (row.available_at) item.available_at = row.available_at;
            } else {
                // DB-only item (added via catalog management) — add to in-memory catalog
                SUPPLY_CATALOG.push({
                    item_name: row.item_name,
                    category: row.category,
                    unit: row.unit || 'units',
                    available_at: row.available_at || ['Main Winery', 'Jacktown', 'Westmoreland'],
                    product_url: row.product_url || '',
                    supplier: row.supplier || '',
                    stock_status: row.stock_status || 'in_stock'
                });
            }
        }
    } catch (e) {
        console.warn('Could not load catalog data:', e);
    }
}
