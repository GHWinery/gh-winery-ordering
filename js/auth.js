// ============================================================
// Auth Module — Login, Signup, Session Management
// ============================================================

const Auth = {
    currentUser: null,
    currentProfile: null,

    async init() {
        try {
            const { data: { session } } = await db.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                await this.loadProfile();
                return true;
            }
        } catch (err) {
            console.error('Auth init error:', err);
        }
        return false;
    },

    async login(email, password) {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.currentUser = data.user;
        try {
            await this.loadProfile();
        } catch (err) {
            console.warn('Profile not found, may need to create one:', err);
        }
        return data;
    },

    async signup(email, password, name, role, storeLocation) {
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) throw error;

        // If email confirmation is off, user is immediately available
        // If email confirmation is on, data.user exists but session may be null
        if (!data.user) throw new Error('Signup failed — no user returned');
        if (!data.session) throw new Error('Signup succeeded but email confirmation may be required. Check your inbox or disable email confirmation in Supabase Auth settings.');

        this.currentUser = data.user;

        const { error: profileError } = await db.from('profiles').insert({
            id: data.user.id,
            name,
            role,
            store_location: storeLocation || null
        });
        if (profileError) throw profileError;

        await this.loadProfile();
        return data;
    },

    async loadProfile() {
        if (!this.currentUser) return null;
        const { data, error } = await db
            .from('profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .maybeSingle();
        if (error) {
            console.error('Load profile error:', error);
            return null;
        }
        this.currentProfile = data;
        return data;
    },

    async logout() {
        await db.auth.signOut();
        this.currentUser = null;
        this.currentProfile = null;
    },

    getRole() {
        return this.currentProfile?.role || null;
    },

    getLocation() {
        return this.currentProfile?.store_location || null;
    },

    getName() {
        return this.currentProfile?.name || '';
    },

    isStoreStaff() {
        return this.getRole() === 'store_staff';
    },

    isDistribution() {
        return this.getRole() === 'distribution';
    },

    isSupplies() {
        return this.getRole() === 'supplies';
    },

    isAdmin() {
        return this.getRole() === 'admin';
    },

    isFulfillmentTeam() {
        return this.isDistribution() || this.isSupplies();
    }
};
