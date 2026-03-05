// ============================================================
// App Module — Main entry point, routing, event listeners
// ============================================================

const App = {
    currentView: 'dashboard',

    async init() {
        // Check for existing session
        const hasSession = await Auth.init();
        await loadCatalogUrls();
        if (hasSession && Auth.currentProfile) {
            this.showApp();
        } else if (hasSession && !Auth.currentProfile) {
            this.showProfileSetup();
        } else {
            this.showLogin();
        }

        this.bindEvents();
    },

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');

            try {
                errorEl.classList.add('hidden');
                console.log('Attempting login for:', email);
                await Auth.login(email, password);
                console.log('Login successful, profile:', Auth.currentProfile);
                if (Auth.currentProfile) {
                    this.showApp();
                } else {
                    this.showProfileSetup();
                }
            } catch (err) {
                console.error('Login error:', err);
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            }
        });

        // Signup form
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const role = document.getElementById('signup-role').value;
            const location = document.getElementById('signup-location').value;
            const errorEl = document.getElementById('login-error');

            if (!role) {
                errorEl.textContent = 'Please select a role.';
                errorEl.classList.remove('hidden');
                return;
            }
            if (role === 'store_staff' && !location) {
                errorEl.textContent = 'Store staff must select a location.';
                errorEl.classList.remove('hidden');
                return;
            }

            try {
                errorEl.classList.add('hidden');
                await Auth.signup(email, password, name, role, location);
                this.showApp();
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            }
        });

        // Toggle login/signup
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
            document.getElementById('login-error').classList.add('hidden');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('login-error').classList.add('hidden');
        });

        // Show/hide location based on role (signup form)
        document.getElementById('signup-role').addEventListener('change', (e) => {
            const locGroup = document.getElementById('signup-location-group');
            locGroup.style.display = e.target.value === 'store_staff' ? '' : 'none';
        });

        // Show/hide location based on role (profile setup form)
        document.getElementById('setup-role').addEventListener('change', (e) => {
            const locGroup = document.getElementById('setup-location-group');
            locGroup.style.display = e.target.value === 'store_staff' ? '' : 'none';
        });

        // Profile setup form
        document.getElementById('profile-setup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('setup-name').value.trim();
            const role = document.getElementById('setup-role').value;
            const location = document.getElementById('setup-location').value;
            const errorEl = document.getElementById('setup-error');

            if (!role) {
                errorEl.textContent = 'Please select a role.';
                errorEl.classList.remove('hidden');
                return;
            }
            if (role === 'store_staff' && !location) {
                errorEl.textContent = 'Store staff must select a location.';
                errorEl.classList.remove('hidden');
                return;
            }

            try {
                errorEl.classList.add('hidden');
                const { error } = await db.from('profiles').insert({
                    id: Auth.currentUser.id,
                    name,
                    role,
                    store_location: location || null
                });
                if (error) throw error;
                await Auth.loadProfile();
                this.showApp();
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await Auth.logout();
            this.showLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigate(btn.dataset.view);
            });
        });

        // Back to orders
        document.getElementById('back-to-orders').addEventListener('click', () => {
            this.navigate('orders');
        });

        // Order filters
        document.getElementById('order-status-filter').addEventListener('change', () => {
            UI.renderOrdersList();
        });
        document.getElementById('order-location-filter').addEventListener('change', () => {
            UI.renderOrdersList();
        });

        // Fulfillment filters
        document.getElementById('fulfillment-status-filter').addEventListener('change', () => {
            UI.renderFulfillmentQueue();
        });
        document.getElementById('fulfillment-location-filter').addEventListener('change', () => {
            UI.renderFulfillmentQueue();
        });

        // Receiving filter
        document.getElementById('receiving-location-filter').addEventListener('change', () => {
            UI.renderReceiving();
        });

        // Catalog filter
        document.getElementById('catalog-category-filter').addEventListener('change', () => {
            UI.renderCatalog();
        });
    },

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
        document.getElementById('profile-setup-screen').classList.add('hidden');
        // Reset form state
        document.getElementById('login-form').reset();
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-error').classList.add('hidden');
    },

    showProfileSetup() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.add('hidden');
        document.getElementById('profile-setup-screen').classList.remove('hidden');
    },

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('profile-setup-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');

        // Set user info in header
        document.getElementById('user-name').textContent = Auth.getName();
        document.getElementById('user-role-badge').textContent = roleLabel(Auth.getRole());

        // Show/hide nav based on role
        const navNewOrder = document.getElementById('nav-new-order');
        const navFulfillment = document.getElementById('nav-fulfillment');

        // Store staff can create orders; fulfillment can't
        navNewOrder.style.display = (Auth.isStoreStaff() || Auth.isAdmin()) ? '' : 'none';

        // Fulfillment teams and admin see fulfillment queue
        navFulfillment.style.display = (Auth.isFulfillmentTeam() || Auth.isAdmin()) ? '' : 'none';

        // Catalog tab visible to admin and supplies team
        const navCatalog = document.getElementById('nav-catalog');
        navCatalog.style.display = (Auth.isAdmin() || Auth.isSupplies()) ? '' : 'none';

        // Navigate to default view
        if (Auth.isFulfillmentTeam()) {
            this.navigate('fulfillment');
        } else {
            this.navigate('dashboard');
        }
    },

    navigate(view) {
        // Reset order form state when leaving
        if (this.currentView === 'new-order' && view !== 'new-order') {
            UI.selectedOrderLocation = null;
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

        // Deactivate all nav
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        // Show target view
        const viewEl = document.getElementById(`view-${view}`);
        if (viewEl) {
            viewEl.classList.remove('hidden');
        }

        // Activate nav button
        const navBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
        if (navBtn) navBtn.classList.add('active');

        this.currentView = view;

        // Render view content
        switch (view) {
            case 'dashboard':
                UI.renderDashboard();
                break;
            case 'new-order':
                UI.renderOrderForm();
                break;
            case 'orders':
                UI.renderOrdersList();
                break;
            case 'fulfillment':
                UI.renderFulfillmentQueue();
                break;
            case 'catalog':
                UI.renderCatalog();
                break;
            case 'receiving':
                UI.renderReceiving();
                break;
        }
    },

    viewOrder(orderId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById('view-order-detail').classList.remove('hidden');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        UI.renderOrderDetail(orderId);
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
