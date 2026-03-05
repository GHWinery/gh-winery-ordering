// ============================================================
// Orders Module — CRUD operations for orders and order items
// ============================================================

const Orders = {

    // Create a new order with items
    async create(storeLocation, items, notes = '') {
        const { data: order, error: orderErr } = await db
            .from('orders')
            .insert({
                store_location: storeLocation,
                status: 'submitted',
                created_by: Auth.currentUser.id,
                notes
            })
            .select()
            .single();
        if (orderErr) throw orderErr;

        const orderItems = items.map(item => ({
            order_id: order.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            fulfillment_team: CATEGORY_TEAM_MAP[item.category],
            status: 'pending',
            received_by_store: false,
            notes: item.notes || ''
        }));

        const { error: itemsErr } = await db
            .from('order_items')
            .insert(orderItems);
        if (itemsErr) throw itemsErr;

        return order;
    },

    // Update order notes
    async updateNotes(orderId, notes) {
        const { error } = await db
            .from('orders')
            .update({ notes })
            .eq('id', orderId);
        if (error) throw error;
    },

    // Update an order item's quantity/notes
    async updateItem(itemId, updates) {
        const { error } = await db
            .from('order_items')
            .update(updates)
            .eq('id', itemId);
        if (error) throw error;
    },

    // Add new items to an existing order
    async addItems(orderId, items) {
        const orderItems = items.map(item => ({
            order_id: orderId,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            fulfillment_team: CATEGORY_TEAM_MAP[item.category],
            status: 'pending',
            received_by_store: false,
            notes: item.notes || ''
        }));
        const { error } = await db.from('order_items').insert(orderItems);
        if (error) throw error;
    },

    // Remove an item from an order
    async removeItem(itemId) {
        const { error } = await db
            .from('order_items')
            .delete()
            .eq('id', itemId);
        if (error) throw error;
    },

    // List orders
    async list(filters = {}) {
        let query = db
            .from('orders')
            .select('*, profiles!created_by(name)')
            .order('created_at', { ascending: false });

        if (Auth.isStoreStaff()) {
            query = query.eq('store_location', Auth.getLocation());
        }
        if (filters.status === 'archived') {
            query = query.eq('status', 'archived');
        } else if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        } else {
            query = query.neq('status', 'archived');
        }
        if (filters.location && filters.location !== 'all') {
            query = query.eq('store_location', filters.location);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Get single order with all items
    async get(orderId) {
        const { data: order, error: orderErr } = await db
            .from('orders')
            .select('*, profiles!created_by(name)')
            .eq('id', orderId)
            .single();
        if (orderErr) throw orderErr;

        const { data: items, error: itemsErr } = await db
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)
            .order('category', { ascending: true })
            .order('item_name', { ascending: true });
        if (itemsErr) throw itemsErr;

        order.items = items;
        return order;
    },

    // Delete an order
    async delete(orderId) {
        // Delete items first, then order
        const { error: itemsErr } = await db.from('order_items').delete().eq('order_id', orderId);
        if (itemsErr) throw itemsErr;
        const { error } = await db.from('orders').delete().eq('id', orderId);
        if (error) throw error;
    },

    // Archive/unarchive an order
    async archive(orderId) {
        const { error } = await db.from('orders').update({ status: 'archived' }).eq('id', orderId);
        if (error) throw error;
    },

    async unarchive(orderId) {
        // Temporarily set to submitted so checkAndCompleteOrder can recalculate
        const { error } = await db.from('orders').update({ status: 'submitted' }).eq('id', orderId);
        if (error) throw error;
        await this.checkAndCompleteOrder(orderId);
    },

    // Update a single item's fulfillment status
    async updateItemStatus(itemId, newStatus) {
        const { error } = await db
            .from('order_items')
            .update({ status: newStatus })
            .eq('id', itemId);
        if (error) throw error;
    },

    // Bulk update multiple items to a new status
    async bulkUpdateStatus(itemIds, newStatus) {
        const { error } = await db
            .from('order_items')
            .update({ status: newStatus })
            .in('id', itemIds);
        if (error) throw error;
    },

    // Mark an item as received by store
    async markReceived(itemId) {
        const { error } = await db
            .from('order_items')
            .update({ received_by_store: true })
            .eq('id', itemId);
        if (error) throw error;
    },

    // Bulk mark received
    async bulkMarkReceived(itemIds) {
        const { error } = await db
            .from('order_items')
            .update({ received_by_store: true })
            .in('id', itemIds);
        if (error) throw error;
    },

    // Get fulfillment queue items for a team
    async getFulfillmentQueue(team, filters = {}) {
        let query = db
            .from('order_items')
            .select('*, orders!inner(id, store_location, created_at, profiles!created_by(name))')
            .eq('fulfillment_team', team)
            .order('updated_at', { ascending: true });

        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        } else {
            query = query.eq('received_by_store', false);
        }

        if (filters.location && filters.location !== 'all') {
            query = query.eq('orders.store_location', filters.location);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Get items ready for receiving (delivered but not yet received)
    async getReceivingQueue(filters = {}) {
        let query = db
            .from('order_items')
            .select('*, orders!inner(id, store_location, created_at, profiles!created_by(name))')
            .eq('status', 'delivered')
            .eq('received_by_store', false)
            .order('updated_at', { ascending: true });

        if (Auth.isStoreStaff()) {
            query = query.eq('orders.store_location', Auth.getLocation());
        } else if (filters.location && filters.location !== 'all') {
            query = query.eq('orders.store_location', filters.location);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Check and auto-update order status
    async checkAndCompleteOrder(orderId) {
        const { data: items, error } = await db
            .from('order_items')
            .select('status, received_by_store')
            .eq('order_id', orderId);
        if (error) throw error;

        const allReceived = items.every(i => i.status === 'delivered' && i.received_by_store);
        const anyInProgress = items.some(i => i.status !== 'pending');

        let newStatus = 'submitted';
        if (allReceived) newStatus = 'completed';
        else if (anyInProgress) newStatus = 'in_progress';

        await db.from('orders').update({ status: newStatus }).eq('id', orderId);
    },

    // Check and complete multiple orders at once
    async checkAndCompleteOrders(orderIds) {
        const unique = [...new Set(orderIds)];
        for (const id of unique) {
            await this.checkAndCompleteOrder(id);
        }
    },

    // Dashboard stats
    async getDashboardStats() {
        let query = db
            .from('order_items')
            .select('status, received_by_store, fulfillment_team, orders!inner(store_location, status)');

        // Exclude items from archived orders
        query = query.neq('orders.status', 'archived');

        if (Auth.isDistribution()) {
            query = query.eq('fulfillment_team', 'distribution');
        } else if (Auth.isSupplies()) {
            query = query.eq('fulfillment_team', 'supplies');
        } else if (Auth.isStoreStaff()) {
            query = query.eq('orders.store_location', Auth.getLocation());
        }

        const { data, error } = await query;
        if (error) throw error;

        const stats = { pending: 0, in_progress: 0, delivered: 0, received: 0, total: data.length };
        for (const item of data) {
            if (item.received_by_store) stats.received++;
            else if (item.status === 'delivered') stats.delivered++;
            else if (item.status === 'pending') stats.pending++;
            else stats.in_progress++;
        }
        return stats;
    }
};
