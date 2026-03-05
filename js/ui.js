// ============================================================
// UI Module — All view rendering
// ============================================================

const UI = {

    // ==================== Dashboard ====================

    async renderDashboard() {
        const container = document.getElementById('dashboard-cards');
        const activityContainer = document.getElementById('recent-activity');
        container.innerHTML = '<div class="loading">Loading dashboard</div>';

        try {
            const [stats, orders] = await Promise.all([
                Orders.getDashboardStats(),
                Orders.list({})
            ]);

            container.innerHTML = `
                <div class="dash-card card-pending"><div class="card-value">${stats.pending}</div><div class="card-label">Pending</div></div>
                <div class="dash-card card-progress"><div class="card-value">${stats.in_progress}</div><div class="card-label">In Progress</div></div>
                <div class="dash-card card-delivered"><div class="card-value">${stats.delivered}</div><div class="card-label">Delivered</div></div>
                <div class="dash-card"><div class="card-value">${stats.received}</div><div class="card-label">Received</div></div>
                <div class="dash-card"><div class="card-value">${stats.total}</div><div class="card-label">Total Items</div></div>
            `;

            const recent = orders.slice(0, 10);
            if (recent.length === 0) {
                activityContainer.innerHTML = '<div class="empty-state"><p>No orders yet</p></div>';
            } else {
                activityContainer.innerHTML = `<div class="table-container"><table>
                    <thead><tr><th>Date</th><th>Location</th><th>Created By</th><th>Status</th><th></th></tr></thead>
                    <tbody>${recent.map(o => `<tr>
                        <td>${formatDate(o.created_at)}</td>
                        <td>${escapeHtml(o.store_location)}</td>
                        <td>${escapeHtml(o.profiles?.name || 'Unknown')}</td>
                        <td><span class="status-badge status-${o.status}">${ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
                        <td><button class="btn btn-sm btn-outline" onclick="App.viewOrder('${o.id}')">View</button></td>
                    </tr>`).join('')}</tbody></table></div>`;
            }
        } catch (err) {
            container.innerHTML = `<div class="error-msg">Error: ${escapeHtml(err.message)}</div>`;
        }
    },

    // ==================== New Order Form ====================

    selectedOrderLocation: null,

    renderOrderForm() {
        const container = document.getElementById('order-form-container');
        const locationInfo = document.getElementById('order-location-info');
        let location = Auth.getLocation();

        if (!location && Auth.isAdmin()) {
            this.selectedOrderLocation = this.selectedOrderLocation || null;
            locationInfo.innerHTML = '';
            if (!this.selectedOrderLocation) {
                container.innerHTML = `<div class="card" style="text-align:center;padding:32px;">
                    <p style="margin-bottom:16px;">Select a store location to order for:</p>
                    <div style="display:flex;gap:12px;justify-content:center;">
                        <button class="btn btn-primary" onclick="UI.selectedOrderLocation='Main Winery';UI.renderOrderForm()">Main Winery</button>
                        <button class="btn btn-primary" onclick="UI.selectedOrderLocation='Jacktown';UI.renderOrderForm()">Jacktown</button>
                        <button class="btn btn-primary" onclick="UI.selectedOrderLocation='Westmoreland';UI.renderOrderForm()">Westmoreland</button>
                    </div></div>`;
                return;
            }
            location = this.selectedOrderLocation;
        }

        if (!location) {
            container.innerHTML = '<div class="empty-state"><p>Only store staff and admins can create orders.</p></div>';
            return;
        }

        locationInfo.innerHTML = `Ordering for: <strong>${escapeHtml(location)}</strong>` +
            (Auth.isAdmin() ? ` <a href="#" onclick="UI.selectedOrderLocation=null;UI.renderOrderForm();return false;" style="font-size:0.85rem">(change)</a>` : '');

        const catalog = getCatalogForLocation(location);
        let html = '<form id="new-order-form">';
        html += '<div class="form-group"><label for="order-notes">Order Notes (optional)</label>';
        html += '<textarea id="order-notes" rows="2" placeholder="Any special instructions..."></textarea></div>';
        html += '<div class="form-group"><input type="text" id="catalog-search" placeholder="Search items..." oninput="UI.filterOrderItems(this.value)" autocomplete="off" style="width:100%"></div>';

        for (const category of CATEGORY_ORDER) {
            const items = catalog[category];
            if (!items || items.length === 0) continue;
            const team = CATEGORY_TEAM_MAP[category];
            const teamLabel = team === 'distribution' ? 'Distribution' : 'Supplies';
            const isWine = category === 'Wine';

            html += `<div class="category-section">
                <div class="category-header" onclick="UI.toggleCategory(this)">
                    <h3><span class="toggle-icon">&#9662;</span> ${escapeHtml(category)} <span style="font-weight:400;font-size:0.85rem;opacity:0.8">(${teamLabel})</span></h3>
                </div>
                <div class="category-items">
                    ${items.map(item => {
                        const esc = escapeHtml(item.item_name);
                        return `<div class="order-item-row" data-item="${esc}" data-category="${escapeHtml(item.category)}" data-unit="${escapeHtml(item.unit)}">
                            <div class="oir-main">
                                <div class="oir-name">
                                    ${item.product_url ? `<a href="${escapeHtml(item.product_url)}" target="_blank" class="item-name" title="View product">${esc}</a>` : `<span class="item-name">${esc}</span>`}
                                    ${isWine && item.stock_status && item.stock_status !== 'in_stock' ? `<span class="stock-badge stock-${item.stock_status}">${item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Coming Soon'}</span>` : ''}
                                    ${isWine && (!item.stock_status || item.stock_status === 'in_stock') ? '<span class="stock-badge stock-in_stock">In Stock</span>' : ''}
                                </div>
                                ${isWine ? `
                                <div class="oir-qty-group">
                                    <label class="oir-qty-label">Cases</label>
                                    <div class="oir-stepper">
                                        <button type="button" class="stepper-btn stepper-minus" onclick="UI.stepQty(this,-1)">-</button>
                                        <input type="number" min="0" value="0" class="stepper-input" data-qty-for="${esc}">
                                        <button type="button" class="stepper-btn stepper-plus" onclick="UI.stepQty(this,1)">+</button>
                                    </div>
                                </div>
                                <div class="oir-qty-group">
                                    <label class="oir-qty-label">Bottles (unlabeled)</label>
                                    <div class="oir-stepper">
                                        <button type="button" class="stepper-btn stepper-minus" onclick="UI.stepQty(this,-1)">-</button>
                                        <input type="number" min="0" value="0" class="stepper-input" data-bottles-for="${esc}">
                                        <button type="button" class="stepper-btn stepper-plus" onclick="UI.stepQty(this,1)">+</button>
                                    </div>
                                </div>
                                ` : `
                                <div class="oir-stepper">
                                    <button type="button" class="stepper-btn stepper-minus" onclick="UI.stepQty(this,-1)">-</button>
                                    <input type="number" min="0" value="0" class="stepper-input" data-qty-for="${esc}">
                                    <button type="button" class="stepper-btn stepper-plus" onclick="UI.stepQty(this,1)">+</button>
                                </div>
                                `}
                                <input type="text" class="oir-notes" placeholder="Notes" data-notes-for="${esc}">
                            </div>
                        </div>`;
                    }).join('')}
                </div></div>`;
        }

        html += '<div class="order-actions"><button type="submit" class="btn btn-primary">Submit Order</button></div></form>';
        container.innerHTML = html;

        document.getElementById('new-order-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await UI.submitNewOrder();
        });
    },

    stepQty(btn, delta) {
        const row = btn.closest('.oir-stepper');
        const input = row.querySelector('.stepper-input');
        const val = Math.max(0, (parseInt(input.value) || 0) + delta);
        input.value = val;
    },

    submitting: false,

    async submitNewOrder() {
        if (this.submitting) return;
        const rows = document.querySelectorAll('.order-item-row');
        const items = [];
        rows.forEach(row => {
            const itemName = row.dataset.item;
            const notesInput = row.querySelector('.oir-notes');
            const notes = notesInput ? notesInput.value.trim() : '';

            // Cases (labeled) or non-wine qty
            const qtyInput = row.querySelector('[data-qty-for]');
            const qty = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;
            if (qty > 0) {
                items.push({
                    item_name: itemName,
                    category: row.dataset.category,
                    quantity: qty,
                    unit: row.dataset.unit,
                    notes
                });
            }

            // Bottles (unlabeled wine)
            const bottlesInput = row.querySelector('[data-bottles-for]');
            const bottles = bottlesInput ? (parseInt(bottlesInput.value) || 0) : 0;
            if (bottles > 0) {
                items.push({
                    item_name: itemName + ' (Unlabeled)',
                    category: row.dataset.category,
                    quantity: bottles,
                    unit: 'bottles',
                    notes
                });
            }
        });
        if (items.length === 0) { showToast('Enter a quantity for at least one item.', 'warning'); return; }
        const confirmed = await showConfirm(`Submit order with ${items.length} item(s)?`);
        if (!confirmed) return;

        this.submitting = true;
        const submitBtn = document.querySelector('#new-order-form .btn-primary');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

        try {
            const notes = document.getElementById('order-notes').value.trim();
            const location = Auth.getLocation() || this.selectedOrderLocation;
            await Orders.create(location, items, notes);
            showToast('Order submitted!', 'success');
            App.navigate('orders');
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            this.submitting = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Order'; }
        }
    },

    toggleCategory(header) {
        header.classList.toggle('collapsed');
        header.nextElementSibling.style.display = header.classList.contains('collapsed') ? 'none' : '';
    },

    filterOrderItems(query) {
        const q = query.toLowerCase().trim();
        document.querySelectorAll('.category-section').forEach(section => {
            let anyVisible = false;
            section.querySelectorAll('.order-item-row').forEach(row => {
                const name = row.dataset.item.toLowerCase();
                const match = !q || name.includes(q);
                row.style.display = match ? '' : 'none';
                if (match) anyVisible = true;
            });
            section.style.display = anyVisible ? '' : 'none';
            const header = section.querySelector('.category-header');
            if (q && anyVisible) {
                header.classList.remove('collapsed');
                header.nextElementSibling.style.display = '';
            } else if (!q) {
                // Restore normal collapsed state when search cleared
                header.nextElementSibling.style.display = header.classList.contains('collapsed') ? 'none' : '';
            }
        });
    },

    // ==================== Orders List ====================

    async renderOrdersList() {
        const container = document.getElementById('orders-list');
        container.innerHTML = '<div class="loading">Loading orders</div>';
        const locationFilter = document.getElementById('order-location-filter');
        if (!Auth.isStoreStaff()) locationFilter.classList.remove('hidden');

        try {
            const orders = await Orders.list({
                status: document.getElementById('order-status-filter').value,
                location: locationFilter.value
            });

            if (orders.length === 0) { container.innerHTML = '<div class="empty-state"><p>No orders found</p></div>'; return; }

            container.innerHTML = `<div class="table-container"><table>
                <thead><tr><th>Date</th><th>Location</th><th>Created By</th><th>Status</th><th>Notes</th><th></th></tr></thead>
                <tbody>${orders.map(o => {
                    const canManage = Auth.isAdmin() || o.created_by === Auth.currentUser.id;
                    return `<tr>
                    <td>${formatDate(o.created_at)}</td>
                    <td>${escapeHtml(o.store_location)}</td>
                    <td>${escapeHtml(o.profiles?.name || 'Unknown')}</td>
                    <td><span class="status-badge status-${o.status}">${ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
                    <td>${escapeHtml(o.notes || '').substring(0, 50)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="App.viewOrder('${o.id}')">View</button>
                        ${canManage && o.status !== 'completed' && o.status !== 'archived' ? `<button class="btn btn-sm btn-info" onclick="UI.editOrder('${o.id}')">Edit</button>` : ''}
                        ${canManage ? (o.status === 'archived' ? `<button class="btn btn-sm btn-info" onclick="UI.unarchiveOrder('${o.id}')">Unarchive</button>` : `<button class="btn btn-sm btn-outline" onclick="UI.archiveOrder('${o.id}')">Archive</button>`) : ''}
                        ${canManage ? `<button class="btn btn-sm btn-danger" onclick="UI.deleteOrderFromList('${o.id}')">Delete</button>` : ''}
                    </td>
                </tr>`;
                }).join('')}</tbody></table></div>`;
        } catch (err) {
            container.innerHTML = `<div class="error-msg">Error: ${escapeHtml(err.message)}</div>`;
        }
    },

    // ==================== Order Detail ====================

    async renderOrderDetail(orderId) {
        const container = document.getElementById('order-detail-content');
        container.innerHTML = '<div class="loading">Loading order</div>';

        try {
            const order = await Orders.get(orderId);
            const grouped = {};
            for (const item of order.items) {
                if (!grouped[item.category]) grouped[item.category] = [];
                grouped[item.category].push(item);
            }

            const canConfirm = Auth.isStoreStaff() || Auth.isAdmin();
            let itemsHtml = '';
            for (const category of CATEGORY_ORDER) {
                const items = grouped[category];
                if (!items) continue;
                const teamLabel = CATEGORY_TEAM_MAP[category] === 'distribution' ? 'Distribution' : 'Supplies';

                itemsHtml += `<div class="order-items-group"><h4>${escapeHtml(category)} (${teamLabel})</h4>
                    <div class="table-container"><table>
                    <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Status</th><th>Received</th><th>Notes</th>${canConfirm ? '<th></th>' : ''}</tr></thead>
                    <tbody>${items.map(item => `<tr>
                        <td>${(() => { const baseName = item.item_name.replace(' (Unlabeled)', ''); const ci = SUPPLY_CATALOG.find(c => c.item_name === baseName && c.category === item.category); return ci && ci.product_url ? `<a href="${escapeHtml(ci.product_url)}" target="_blank" title="View product">${escapeHtml(item.item_name)}</a>` : escapeHtml(item.item_name); })()}</td>
                        <td><strong>${item.quantity}</strong></td>
                        <td>${escapeHtml(item.unit)}</td>
                        <td><span class="status-badge status-${item.status}">${STATUS_LABELS[item.status] || item.status}</span></td>
                        <td>${item.received_by_store ? '<span class="status-badge status-received">Received</span>' : (item.status === 'delivered' ? 'Awaiting' : '-')}</td>
                        <td>${escapeHtml(item.notes || '')}</td>
                        ${canConfirm ? `<td>${item.status === 'delivered' && !item.received_by_store
                            ? `<button class="btn btn-sm btn-success" onclick="UI.confirmReceive('${item.id}','${orderId}')">Confirm Receipt</button>` : ''}</td>` : ''}
                    </tr>`).join('')}</tbody></table></div></div>`;
            }

            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3>Order Details</h3>
                        <div>
                            <span class="status-badge status-${order.status}">${ORDER_STATUS_LABELS[order.status] || order.status}</span>
                            ${order.status !== 'completed' ? `<button class="btn btn-sm btn-info" style="margin-left:8px" onclick="UI.editOrder('${order.id}')">Edit Order</button>` : ''}
                        </div>
                    </div>
                    <div class="order-meta">
                        <div class="meta-item"><label>Location</label><span>${escapeHtml(order.store_location)}</span></div>
                        <div class="meta-item"><label>Created By</label><span>${escapeHtml(order.profiles?.name || 'Unknown')}</span></div>
                        <div class="meta-item"><label>Created</label><span>${formatDateTime(order.created_at)}</span></div>
                        <div class="meta-item"><label>Last Updated</label><span>${formatDateTime(order.updated_at)}</span></div>
                        ${order.notes ? `<div class="meta-item" style="grid-column:1/-1"><label>Notes</label><span>${escapeHtml(order.notes)}</span></div>` : ''}
                    </div>
                </div>
                ${itemsHtml}`;
        } catch (err) {
            container.innerHTML = `<div class="error-msg">Error: ${escapeHtml(err.message)}</div>`;
        }
    },

    async confirmReceive(itemId, orderId) {
        try {
            await Orders.markReceived(itemId);
            await Orders.checkAndCompleteOrder(orderId);
            showToast('Item received!', 'success');
            await UI.renderOrderDetail(orderId);
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    // ==================== Edit Order ====================

    async editOrder(orderId) {
        const container = document.getElementById('order-detail-content');
        container.innerHTML = '<div class="loading">Loading order for editing</div>';

        // Switch to detail view
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById('view-order-detail').classList.remove('hidden');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        try {
            const order = await Orders.get(orderId);
            const grouped = {};
            for (const item of order.items) {
                if (!grouped[item.category]) grouped[item.category] = [];
                grouped[item.category].push(item);
            }

            let itemsHtml = '';
            for (const category of CATEGORY_ORDER) {
                const items = grouped[category];
                if (!items) continue;

                itemsHtml += `<div class="order-items-group"><h4>${escapeHtml(category)}</h4>
                    <div class="table-container"><table>
                    <thead><tr><th>Item</th><th>Qty</th><th>Notes</th><th>Status</th><th></th></tr></thead>
                    <tbody>${items.map(item => `<tr id="edit-row-${item.id}">
                        <td>${escapeHtml(item.item_name)} <span style="color:${item.item_name.includes('(Unlabeled)') ? 'var(--color-primary)' : '#999'};font-size:0.85rem;font-weight:${item.item_name.includes('(Unlabeled)') ? '600' : '400'}">${escapeHtml(item.unit)}</span></td>
                        <td><input type="number" min="1" value="${item.quantity}" style="width:70px;padding:6px;text-align:center" data-edit-qty="${item.id}"></td>
                        <td><input type="text" value="${escapeHtml(item.notes || '')}" style="width:100%;padding:6px" data-edit-notes="${item.id}"></td>
                        <td><span class="status-badge status-${item.status}">${STATUS_LABELS[item.status] || item.status}</span></td>
                        <td>${item.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="UI.removeOrderItem('${item.id}','${orderId}')">Remove</button>` : ''}</td>
                    </tr>`).join('')}</tbody></table></div></div>`;
            }

            container.innerHTML = `
                <div class="card">
                    <div class="card-header"><h3>Edit Order</h3><span class="status-badge status-${order.status}">${ORDER_STATUS_LABELS[order.status]}</span></div>
                    <div class="order-meta">
                        <div class="meta-item"><label>Location</label><span>${escapeHtml(order.store_location)}</span></div>
                        <div class="meta-item"><label>Created</label><span>${formatDateTime(order.created_at)}</span></div>
                    </div>
                    <div class="form-group" style="margin-top:16px">
                        <label for="edit-order-notes">Order Notes</label>
                        <textarea id="edit-order-notes" rows="2">${escapeHtml(order.notes || '')}</textarea>
                    </div>
                </div>
                ${itemsHtml}
                <div class="card" style="margin-top:16px">
                    <div class="card-header"><h4>Add Item</h4></div>
                    <div style="padding:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                        <select id="edit-add-item" style="flex:1;min-width:180px;padding:8px">
                            ${(() => {
                                const catalog = getCatalogForLocation(order.store_location);
                                let opts = '<option value="">Select item...</option>';
                                for (const cat of CATEGORY_ORDER) {
                                    const items = catalog[cat];
                                    if (!items) continue;
                                    opts += items.map(i => `<option value="${escapeHtml(i.item_name)}|${escapeHtml(i.category)}|${escapeHtml(i.unit)}">${escapeHtml(i.item_name)} (${escapeHtml(cat)})</option>`).join('');
                                }
                                return opts;
                            })()}
                        </select>
                        <input type="number" id="edit-add-qty" min="1" value="1" style="width:70px;padding:8px;text-align:center">
                        <button class="btn btn-sm btn-primary" onclick="UI.addItemToOrder('${orderId}')">+ Add</button>
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline" onclick="App.viewOrder('${orderId}')">Cancel</button>
                    <button class="btn btn-primary" onclick="UI.saveOrderEdits('${orderId}')">Save Changes</button>
                    <button class="btn btn-danger" onclick="UI.deleteOrder('${orderId}')">Delete Order</button>
                </div>`;
        } catch (err) {
            container.innerHTML = `<div class="error-msg">Error: ${escapeHtml(err.message)}</div>`;
        }
    },

    async saveOrderEdits(orderId) {
        try {
            // Save notes
            const notes = document.getElementById('edit-order-notes').value.trim();
            await Orders.updateNotes(orderId, notes);

            // Save item changes
            const qtyInputs = document.querySelectorAll('[data-edit-qty]');
            const promises = [];
            qtyInputs.forEach(input => {
                const itemId = input.dataset.editQty;
                const qty = parseInt(input.value);
                const notesInput = document.querySelector(`[data-edit-notes="${itemId}"]`);
                const itemNotes = notesInput ? notesInput.value.trim() : '';
                if (qty > 0) {
                    promises.push(Orders.updateItem(itemId, { quantity: qty, notes: itemNotes }));
                }
            });
            await Promise.all(promises);
            await Orders.checkAndCompleteOrder(orderId);

            showToast('Order updated!', 'success');
            App.viewOrder(orderId);
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    },

    async addItemToOrder(orderId) {
        const select = document.getElementById('edit-add-item');
        const qtyInput = document.getElementById('edit-add-qty');
        if (!select.value) { showToast('Select an item', 'warning'); return; }
        const [itemName, category, unit] = select.value.split('|');
        const qty = parseInt(qtyInput.value) || 1;
        try {
            await Orders.addItems(orderId, [{ item_name: itemName, category, quantity: qty, unit }]);
            showToast('Item added', 'success');
            UI.editOrder(orderId);
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    async removeOrderItem(itemId, orderId) {
        const confirmed = await showConfirm('Remove this item from the order?');
        if (!confirmed) return;
        try {
            await Orders.removeItem(itemId);
            const order = await Orders.get(orderId);
            if (order.items.length === 0) {
                await Orders.delete(orderId);
                showToast('Last item removed — order deleted', 'success');
                App.navigate('orders');
                return;
            }
            showToast('Item removed', 'success');
            UI.editOrder(orderId);
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    async deleteOrder(orderId) {
        const confirmed = await showConfirm('Delete this entire order? This cannot be undone.');
        if (!confirmed) return;
        try {
            await Orders.delete(orderId);
            showToast('Order deleted', 'success');
            App.navigate('orders');
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    async deleteOrderFromList(orderId) {
        const confirmed = await showConfirm('Delete this entire order? This cannot be undone.');
        if (!confirmed) return;
        try {
            await Orders.delete(orderId);
            showToast('Order deleted', 'success');
            this.renderOrdersList();
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    async archiveOrder(orderId) {
        const confirmed = await showConfirm('Archive this order? It can be unarchived later.');
        if (!confirmed) return;
        try {
            await Orders.archive(orderId);
            showToast('Order archived', 'success');
            this.renderOrdersList();
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    async unarchiveOrder(orderId) {
        try {
            await Orders.unarchive(orderId);
            showToast('Order unarchived', 'success');
            this.renderOrdersList();
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    // ==================== Fulfillment Queue ====================

    async renderFulfillmentQueue() {
        const container = document.getElementById('fulfillment-queue');
        const titleEl = document.getElementById('fulfillment-title');

        let team;
        if (Auth.isDistribution()) team = 'distribution';
        else if (Auth.isSupplies()) team = 'supplies';
        else if (Auth.isAdmin()) team = null;
        else { container.innerHTML = '<div class="empty-state"><p>Fulfillment queue is for team members.</p></div>'; return; }

        titleEl.textContent = team
            ? `${team === 'distribution' ? 'Distribution' : 'Supplies'} Queue`
            : 'All Fulfillment Items';

        const statusFilter = document.getElementById('fulfillment-status-filter');
        const prevStatus = statusFilter.value;
        const statuses = ALL_ITEM_STATUSES;
        statusFilter.innerHTML = '<option value="all">All Active</option>' +
            statuses.map(s => `<option value="${s}">${STATUS_LABELS[s] || s}</option>`).join('');
        if ([...statusFilter.options].some(o => o.value === prevStatus)) statusFilter.value = prevStatus;

        container.innerHTML = '<div class="loading">Loading queue</div>';

        try {
            const locFilter = document.getElementById('fulfillment-location-filter').value;
            const stFilter = statusFilter.value;

            let items;
            if (team) {
                items = await Orders.getFulfillmentQueue(team, { status: stFilter, location: locFilter });
            } else {
                const [dist, sup] = await Promise.all([
                    Orders.getFulfillmentQueue('distribution', { status: stFilter, location: locFilter }),
                    Orders.getFulfillmentQueue('supplies', { status: stFilter, location: locFilter })
                ]);
                items = [...dist, ...sup];
            }

            if (items.length === 0) { container.innerHTML = '<div class="empty-state"><p>No items in queue</p></div>'; return; }

            // Group by order
            const byOrder = {};
            for (const item of items) {
                const oid = item.orders.id;
                if (!byOrder[oid]) byOrder[oid] = { order: item.orders, items: [] };
                byOrder[oid].items.push(item);
            }

            // Toolbar: always visible, selection count updates dynamically
            let html = `<div class="bulk-toolbar" style="background:#fff;padding:14px 16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:16px;position:sticky;top:0;z-index:10;">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-outline" onclick="UI.bulkSelectAll()">Select All</button>
                    <button class="btn btn-sm btn-outline" onclick="UI.bulkDeselectAll()">Clear</button>
                    <span style="color:#666;font-size:0.9rem" id="bulk-count">0 selected</span>
                    <span style="flex:1"></span>
                    <span style="font-weight:600;font-size:0.85rem;color:#666">Set status:</span>
                    ${statuses.map(s => `<button class="btn btn-sm btn-status-pick" data-bulk-to="${s}" onclick="UI.bulkSetStatus('${s}')" style="opacity:0.7">${STATUS_LABELS[s]}</button>`).join('')}
                </div>
            </div>`;

            for (const oid of Object.keys(byOrder)) {
                const group = byOrder[oid];
                html += `<div class="fulfillment-card">
                    <div class="fulfillment-card-header" style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <strong>${escapeHtml(group.order.store_location)}</strong>
                            <span class="order-info" style="margin-left:8px">
                                ${formatDate(group.order.created_at)} &middot; ${escapeHtml(group.order.profiles?.name || 'Unknown')}
                            </span>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center">
                            <button class="btn btn-sm btn-outline" onclick="UI.selectOrderItems('${oid}')">Select All</button>
                            <a href="#" class="btn btn-sm btn-outline" onclick="App.viewOrder('${oid}');return false;">View Order</a>
                        </div>
                    </div>
                    ${group.items.map(item => {
                        return `<label class="fulfillment-item" style="cursor:pointer" for="chk-${item.id}">
                            <input type="checkbox" id="chk-${item.id}" class="bulk-check" data-item-id="${item.id}" data-order-id="${item.order_id}" data-team="${item.fulfillment_team}" onchange="UI.updateBulkCount()" style="width:18px;height:18px;margin-right:10px;flex-shrink:0">
                            <div class="fulfillment-item-info" style="flex:1">
                                <span class="item-name">${(() => { const baseName = item.item_name.replace(' (Unlabeled)', ''); const ci = SUPPLY_CATALOG.find(c => c.item_name === baseName && c.category === item.category); return ci && ci.product_url ? `<a href="${escapeHtml(ci.product_url)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--color-primary)">${escapeHtml(item.item_name)}</a>` : escapeHtml(item.item_name); })()}</span>
                                <span class="item-detail">
                                    ${item.quantity} ${escapeHtml(item.unit)} &middot; ${escapeHtml(item.category)}
                                    ${item.notes ? ` &middot; "${escapeHtml(item.notes)}"` : ''}
                                </span>
                            </div>
                            <span class="status-badge status-${item.status}">${STATUS_LABELS[item.status] || item.status}</span>
                        </label>`;
                    }).join('')}
                </div>`;
            }

            container.innerHTML = html;
        } catch (err) {
            container.innerHTML = `<div class="error-msg">Error: ${escapeHtml(err.message)}</div>`;
        }
    },

    updateBulkCount() {
        const checked = document.querySelectorAll('.bulk-check:checked');
        document.getElementById('bulk-count').textContent = `${checked.length} selected`;
    },

    bulkSelectAll() {
        document.querySelectorAll('.bulk-check').forEach(cb => cb.checked = true);
        this.updateBulkCount();
    },

    bulkDeselectAll() {
        document.querySelectorAll('.bulk-check').forEach(cb => cb.checked = false);
        this.updateBulkCount();
    },

    selectOrderItems(orderId) {
        document.querySelectorAll(`.bulk-check[data-order-id="${orderId}"]`).forEach(cb => cb.checked = true);
        this.updateBulkCount();
    },

    async bulkSetStatus(newStatus) {
        const checked = document.querySelectorAll('.bulk-check:checked');
        if (checked.length === 0) { showToast('Select items first', 'warning'); return; }

        const validIds = [];
        const orderIds = [];
        checked.forEach(cb => {
            validIds.push(cb.dataset.itemId);
            orderIds.push(cb.dataset.orderId);
        });

        const confirmed = await showConfirm(`Set ${validIds.length} item(s) to "${STATUS_LABELS[newStatus]}"?`);
        if (!confirmed) return;

        try {
            await Orders.bulkUpdateStatus(validIds, newStatus);
            await Orders.checkAndCompleteOrders(orderIds);
            showToast(`${validIds.length} items → ${STATUS_LABELS[newStatus]}${skipMsg}`, 'success');
            await UI.renderFulfillmentQueue();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    },

    // ==================== Receiving ====================

    async renderReceiving() {
        const container = document.getElementById('receiving-list');
        const recvLocFilter = document.getElementById('receiving-location-filter');
        if (Auth.isStoreStaff()) recvLocFilter.classList.add('hidden');
        else recvLocFilter.classList.remove('hidden');
        container.innerHTML = '<div class="loading">Loading items to receive</div>';

        try {
            const items = await Orders.getReceivingQueue({
                location: document.getElementById('receiving-location-filter').value
            });

            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No items waiting to be received</p></div>';
                return;
            }

            // Group by order
            const byOrder = {};
            for (const item of items) {
                const oid = item.orders.id;
                if (!byOrder[oid]) byOrder[oid] = { order: item.orders, items: [] };
                byOrder[oid].items.push(item);
            }

            const canReceive = Auth.isStoreStaff() || Auth.isAdmin();

            let html = '';
            if (canReceive) {
                html += `<div class="bulk-toolbar" style="background:#fff;padding:14px 16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:16px;position:sticky;top:0;z-index:10;">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-outline" onclick="UI.recvSelectAll()">Select All</button>
                        <button class="btn btn-sm btn-outline" onclick="UI.recvDeselectAll()">Clear</button>
                        <span style="color:#666;font-size:0.9rem" id="recv-count">0 selected</span>
                        <span style="flex:1"></span>
                        <button class="btn btn-sm btn-primary" onclick="UI.bulkReceive()">Mark Received</button>
                    </div>
                </div>`;
            }

            for (const oid of Object.keys(byOrder)) {
                const group = byOrder[oid];
                html += `<div class="fulfillment-card">
                    <div class="fulfillment-card-header" style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <strong>${escapeHtml(group.order.store_location)}</strong>
                            <span style="color:#666;font-size:0.85rem;margin-left:8px">${formatDate(group.order.created_at)}</span>
                            <span style="color:#999;font-size:0.85rem;margin-left:8px">by ${escapeHtml(group.order.profiles?.name || 'Unknown')}</span>
                        </div>
                        <div style="display:flex;gap:6px;">
                            ${canReceive ? `<button class="btn btn-sm btn-outline" onclick="UI.recvSelectOrder('${oid}')">Select All</button>` : ''}
                            <a href="#" class="btn btn-sm btn-outline" onclick="App.viewOrder('${oid}');return false;">View Order</a>
                        </div>
                    </div>
                    ${group.items.map(item => {
                        return `<div class="fulfillment-item" style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--color-border-light);">
                            ${canReceive ? `<input type="checkbox" class="recv-check" data-item-id="${item.id}" data-order-id="${item.order_id}" onchange="UI.updateRecvCount()" style="width:18px;height:18px;flex-shrink:0">` : ''}
                            <div style="flex:1">
                                <span class="item-name">${escapeHtml(item.item_name)}</span>
                                <span class="item-detail" style="color:#666;font-size:0.85rem;margin-left:8px">
                                    ${item.quantity} ${escapeHtml(item.unit)} &middot; ${escapeHtml(item.category)}
                                    ${item.notes ? ` &middot; "${escapeHtml(item.notes)}"` : ''}
                                </span>
                            </div>
                            ${canReceive ? `<button class="btn btn-sm btn-primary" onclick="UI.receiveItem('${item.id}','${item.order_id}')">Receive</button>` : ''}
                        </div>`;
                    }).join('')}
                </div>`;
            }

            container.innerHTML = html;
        } catch (err) {
            container.innerHTML = `<div class="error-msg">Error: ${escapeHtml(err.message)}</div>`;
        }
    },

    updateRecvCount() {
        const count = document.querySelectorAll('.recv-check:checked').length;
        const el = document.getElementById('recv-count');
        if (el) el.textContent = `${count} selected`;
    },

    recvSelectAll() {
        document.querySelectorAll('.recv-check').forEach(cb => cb.checked = true);
        this.updateRecvCount();
    },

    recvDeselectAll() {
        document.querySelectorAll('.recv-check').forEach(cb => cb.checked = false);
        this.updateRecvCount();
    },

    recvSelectOrder(orderId) {
        document.querySelectorAll(`.recv-check[data-order-id="${orderId}"]`).forEach(cb => cb.checked = true);
        this.updateRecvCount();
    },

    async receiveItem(itemId, orderId) {
        try {
            await Orders.markReceived(itemId);
            await Orders.checkAndCompleteOrder(orderId);
            showToast('Item received', 'success');
            this.renderReceiving();
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    async bulkReceive() {
        const checked = document.querySelectorAll('.recv-check:checked');
        if (checked.length === 0) { showToast('Select items first', 'warning'); return; }

        const confirmed = await showConfirm(`Mark ${checked.length} item(s) as received?`);
        if (!confirmed) return;

        const itemIds = [];
        const orderIds = [];
        checked.forEach(cb => {
            itemIds.push(cb.dataset.itemId);
            orderIds.push(cb.dataset.orderId);
        });

        try {
            await Orders.bulkMarkReceived(itemIds);
            await Orders.checkAndCompleteOrders(orderIds);
            showToast(`${itemIds.length} items received`, 'success');
            this.renderReceiving();
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
    },

    // ==================== Item Catalog ====================

    async renderCatalog() {
        const container = document.getElementById('catalog-list');
        container.innerHTML = '<div class="loading">Loading catalog</div>';

        const catFilter = document.getElementById('catalog-category-filter').value;

        // Use the in-memory catalog, grouped by category
        const allItems = catFilter === 'all'
            ? SUPPLY_CATALOG
            : SUPPLY_CATALOG.filter(i => i.category === catFilter);

        // Group by category
        const grouped = {};
        for (const item of allItems) {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
        }

        const locations = ['Main Winery', 'Jacktown', 'Westmoreland'];
        let html = '<p style="color:#666;margin-bottom:16px;font-size:0.9rem">Manage items, set suppliers/URLs, and choose which stores each item appears for.</p>';

        for (const category of CATEGORY_ORDER) {
            const items = grouped[category] || [];
            const isWine = category === 'Wine';

            html += `<div class="category-section">
                <div class="category-header" onclick="UI.toggleCategory(this)">
                    <h3><span class="toggle-icon">&#9662;</span> ${escapeHtml(category)} <span style="font-weight:400;font-size:0.85rem;opacity:0.8">(${items.length} items)</span></h3>
                </div>
                <div class="category-items">
                    ${items.map(item => {
                        const esc = escapeHtml(item.item_name);
                        const avail = item.available_at || locations;
                        return `<div class="catalog-row catalog-row-editable">
                            <div class="catalog-row-info">
                                <input type="text" class="catalog-name-input" value="${esc}"
                                    data-catalog-item="${esc}"
                                    data-catalog-category="${escapeHtml(item.category)}"
                                    onchange="UI.saveCatalogName(this)">
                                <span class="item-unit">${escapeHtml(item.unit)}</span>
                            </div>
                            ${isWine ? `
                            <select class="stock-status-select" data-catalog-item="${esc}" data-catalog-category="${escapeHtml(item.category)}" onchange="UI.saveCatalogField(this)" data-catalog-field="stock_status">
                                <option value="in_stock" ${(item.stock_status || 'in_stock') === 'in_stock' ? 'selected' : ''}>In Stock</option>
                                <option value="out_of_stock" ${item.stock_status === 'out_of_stock' ? 'selected' : ''}>Out of Stock</option>
                                <option value="coming_soon" ${item.stock_status === 'coming_soon' ? 'selected' : ''}>Coming Soon</option>
                            </select>
                            ` : `
                            <div class="catalog-row-fields">
                                <input type="text" placeholder="Supplier..." value="${escapeHtml(item.supplier || '')}"
                                    data-catalog-item="${esc}"
                                    data-catalog-category="${escapeHtml(item.category)}"
                                    data-catalog-field="supplier"
                                    onchange="UI.saveCatalogField(this)">
                                <input type="url" placeholder="Product URL..." value="${escapeHtml(item.product_url || '')}"
                                    data-catalog-item="${esc}"
                                    data-catalog-category="${escapeHtml(item.category)}"
                                    data-catalog-field="product_url"
                                    onchange="UI.saveCatalogField(this)">
                                ${item.product_url ? `<a href="${escapeHtml(item.product_url)}" target="_blank" class="btn btn-sm btn-outline" title="Open link">&#8599;</a>` : ''}
                            </div>
                            `}
                            <div class="catalog-stores">
                                ${locations.map(loc => `<label class="store-check"><input type="checkbox" ${avail.includes(loc) ? 'checked' : ''}
                                    data-catalog-item="${esc}" data-catalog-category="${escapeHtml(item.category)}" data-store="${loc}"
                                    onchange="UI.saveCatalogStores(this)">${loc.replace('Main Winery','Main').replace('Westmoreland','West')}</label>`).join('')}
                            </div>
                            <button class="btn btn-sm btn-danger catalog-delete-btn" onclick="UI.deleteCatalogItem('${esc}','${escapeHtml(item.category)}')" title="Delete item">&times;</button>
                        </div>`;
                    }).join('')}
                    <div class="catalog-add-row">
                        <input type="text" class="catalog-add-input" placeholder="New item name..." id="add-item-${escapeHtml(category).replace(/\s/g,'-')}">
                        <input type="text" class="catalog-add-input" placeholder="Unit (e.g. cases, boxes)" id="add-unit-${escapeHtml(category).replace(/\s/g,'-')}" style="max-width:140px">
                        <button class="btn btn-sm btn-primary" onclick="UI.addCatalogItem('${escapeHtml(category)}')">+ Add</button>
                    </div>
                </div>
            </div>`;
        }

        container.innerHTML = html;
    },

    async saveCatalogName(input) {
        const oldName = input.dataset.catalogItem;
        const category = input.dataset.catalogCategory;
        const newName = input.value.trim();
        if (!newName || newName === oldName) return;

        // Update in-memory catalog
        const catalogItem = SUPPLY_CATALOG.find(i => i.item_name === oldName && i.category === category);
        if (catalogItem) catalogItem.item_name = newName;

        // Update data attributes on all inputs in this row
        input.closest('.catalog-row').querySelectorAll('[data-catalog-item]').forEach(el => {
            el.dataset.catalogItem = newName;
        });

        // Save to Supabase
        try {
            const { data } = await db
                .from('supply_catalog')
                .select('id')
                .eq('item_name', oldName)
                .eq('category', category)
                .maybeSingle();

            if (data) {
                await db.from('supply_catalog').update({ item_name: newName }).eq('id', data.id);
            } else {
                await db.from('supply_catalog').insert({
                    item_name: newName,
                    category: category,
                    unit: catalogItem?.unit || 'units',
                    available_at: catalogItem?.available_at || ['Main Winery', 'Jacktown', 'Westmoreland'],
                    product_url: catalogItem?.product_url || '',
                    supplier: catalogItem?.supplier || '',
                    stock_status: catalogItem?.stock_status || 'in_stock'
                });
            }
            showToast('Name saved', 'success');
        } catch (err) {
            showToast('Error saving: ' + err.message, 'error');
        }
    },

    async saveCatalogField(input) {
        const itemName = input.dataset.catalogItem;
        const category = input.dataset.catalogCategory;
        const field = input.dataset.catalogField;
        const value = input.value.trim();

        // Update in-memory catalog
        const catalogItem = SUPPLY_CATALOG.find(i => i.item_name === itemName && i.category === category);
        if (catalogItem) catalogItem[field] = value;

        // Save to Supabase
        try {
            const { data } = await db
                .from('supply_catalog')
                .select('id')
                .eq('item_name', itemName)
                .eq('category', category)
                .maybeSingle();

            if (data) {
                await db.from('supply_catalog').update({ [field]: value }).eq('id', data.id);
            } else {
                await db.from('supply_catalog').insert({
                    item_name: itemName,
                    category: category,
                    unit: catalogItem?.unit || 'units',
                    [field]: value
                });
            }
            showToast('Saved', 'success');
        } catch (err) {
            showToast('Error saving: ' + err.message, 'error');
        }
    },

    async saveCatalogStores(checkbox) {
        const itemName = checkbox.dataset.catalogItem;
        const category = checkbox.dataset.catalogCategory;
        const row = checkbox.closest('.catalog-row');
        const checked = [...row.querySelectorAll('[data-store]')].filter(cb => cb.checked).map(cb => cb.dataset.store);

        const catalogItem = SUPPLY_CATALOG.find(i => i.item_name === itemName && i.category === category);
        if (catalogItem) catalogItem.available_at = checked;

        try {
            const { data } = await db.from('supply_catalog').select('id').eq('item_name', itemName).eq('category', category).maybeSingle();
            if (data) {
                await db.from('supply_catalog').update({ available_at: checked }).eq('id', data.id);
            } else {
                await db.from('supply_catalog').insert({
                    item_name: itemName, category, unit: catalogItem?.unit || 'units', available_at: checked
                });
            }
            showToast('Stores updated', 'success');
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    },

    async deleteCatalogItem(itemName, category) {
        const confirmed = await showConfirm(`Delete "${itemName}" from the catalog?`);
        if (!confirmed) return;

        const idx = SUPPLY_CATALOG.findIndex(i => i.item_name === itemName && i.category === category);
        if (idx >= 0) SUPPLY_CATALOG.splice(idx, 1);

        try {
            await db.from('supply_catalog').delete().eq('item_name', itemName).eq('category', category);
            showToast('Item deleted', 'success');
            this.renderCatalog();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    },

    async addCatalogItem(category) {
        const inputId = 'add-item-' + category.replace(/\s/g, '-');
        const input = document.getElementById(inputId);
        const name = input.value.trim();
        if (!name) { showToast('Enter an item name', 'warning'); return; }

        const exists = SUPPLY_CATALOG.find(i => i.item_name === name && i.category === category);
        if (exists) { showToast('Item already exists in this category', 'warning'); return; }

        const isWine = category === 'Wine';
        const unitInput = document.getElementById('add-unit-' + category.replace(/\s/g, '-'));
        const unit = isWine ? 'cases' : (unitInput?.value.trim() || 'units');
        const team = CATEGORY_TEAM_MAP[category];
        const locations = ['Main Winery', 'Jacktown', 'Westmoreland'];

        const newItem = {
            item_name: name, category, unit, available_at: locations,
            fulfillment_team: team
        };

        SUPPLY_CATALOG.push(newItem);

        try {
            await db.from('supply_catalog').insert({
                item_name: name, category, unit, available_at: locations
            });
            showToast('Item added', 'success');
            this.renderCatalog();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    }
};
