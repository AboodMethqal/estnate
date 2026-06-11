const supabaseApi = {
    get baseUrl() { return CONFIG.supabase.url.replace(/\/$/, '') + '/rest/v1'; },
    get headers() {
        return {
            'Content-Type': 'application/json',
            'apikey': CONFIG.supabase.anonKey,
            'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        };
    }
};

function isSupabaseConfigured() {
    const cfg = CONFIG.supabase;
    return cfg.url && cfg.anonKey &&
           cfg.url !== 'https://your-project.supabase.co' &&
           cfg.anonKey !== 'your-anon-key';
}

function buildQueryString(params) {
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            parts.push(`${key}=${encodeURIComponent(value)}`);
        }
    }
    return parts.length ? '?' + parts.join('&') : '';
}

async function fetchProperties(options = {}) {
    const { featured, type, status, limit = 50, offset = 0 } = options;

    if (!isSupabaseConfigured()) {
        return { data: null, error: 'Supabase not configured' };
    }

    try {
        const filters = { select: '*', offset: String(offset), limit: String(limit) };
        if (featured) filters.featured = 'eq.true';
        if (type) filters.property_type = `eq.${type}`;
        if (status) filters.status = `eq.${status}`;

        const url = supabaseApi.baseUrl + '/properties' + buildQueryString(filters);
        const res = await fetch(url, {
            headers: {
                ...supabaseApi.headers,
                'Prefer': 'count=exact'
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching properties:', error);
        return { data: null, error: error.message };
    }
}

async function fetchPropertyById(id) {
    if (!isSupabaseConfigured()) {
        return { data: null, error: 'Supabase not configured' };
    }

    try {
        const url = supabaseApi.baseUrl + '/properties' + buildQueryString({
            select: '*',
            id: `eq.${id}`
        });
        const res = await fetch(url, { headers: supabaseApi.headers });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { data: data[0] || null, error: null };
    } catch (error) {
        console.error('Error fetching property:', error);
        return { data: null, error: error.message };
    }
}

async function submitInquiry(formData) {
    if (!isSupabaseConfigured()) {
        return { data: null, error: 'Supabase not configured' };
    }

    try {
        const res = await fetch(supabaseApi.baseUrl + '/inquiries', {
            method: 'POST',
            headers: supabaseApi.headers,
            body: JSON.stringify([{
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                message: formData.message,
                property_id: formData.property_id || null
            }])
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error submitting inquiry:', error);
        return { data: null, error: error.message };
    }
}

async function addProperty(propertyData) {
    if (!isSupabaseConfigured()) {
        return { data: null, error: 'Supabase not configured' };
    }

    try {
        const res = await fetch(supabaseApi.baseUrl + '/properties', {
            method: 'POST',
            headers: supabaseApi.headers,
            body: JSON.stringify([propertyData])
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error adding property:', error);
        return { data: null, error: error.message };
    }
}

async function fetchCategories() {
    if (!isSupabaseConfigured()) {
        return { data: null, error: 'Supabase not configured' };
    }

    try {
        const url = supabaseApi.baseUrl + '/property_categories' + buildQueryString({ select: '*' });
        const res = await fetch(url, { headers: supabaseApi.headers });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return { data: null, error: error.message };
    }
}
