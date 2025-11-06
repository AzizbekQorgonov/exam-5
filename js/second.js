async function getData(url) {
    try {
        const res = await fetch(url);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = text; }
        if (!res.ok) {
            const err = new Error(`HTTP ${res.status} ${res.statusText}`);
            err.status = res.status;
            err.statusText = res.statusText;
            err.body = data;
            err.url = url;
            throw err;
        }


        if (Array.isArray(data)) return { data, total: data.length };
        if (data && (data.data || data.total)) return data;
        return { data: data, total: Array.isArray(data) ? data.length : (data?.length || 1) };
    } catch (err) {
        if (err && typeof err === 'object' && !err.url) err.url = url;
        throw err;
    }
}