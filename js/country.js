(async function () {
    const statusEl = document.getElementById('status');
    const detailEl = document.getElementById('detail');

    const REST_ENDPOINT = 'https://restcountries.com/v3.1';
    const ENDPOINT = (typeof globalThis !== 'undefined' && typeof globalThis.ENDPOINT !== 'undefined') ? globalThis.ENDPOINT : REST_ENDPOINT;

    function qs(name) {
        return new URLSearchParams(location.search).get(name);
    }

    function setStatus(msg, isError) {
        if (!statusEl) return;
        statusEl.textContent = msg || '';
        // Use Tailwind utility class for error color so the element respects the project's styling
        if (isError) {
            statusEl.classList.add('text-red-500');
        } else {
            statusEl.classList.remove('text-red-500');
        }
    }

    function normalize(item) {
        if (!item) return null;
        const name = item.name && (item.name.common || item.name) ? (typeof item.name === 'string' ? item.name : (item.name.common || '')) : '';
        const nativeName = item.name && item.name.nativeName ? Object.values(item.name.nativeName)[0]?.common || '' : '';
        const population = item.population || item.populationCount || 0;
        const region = item.region || (item.continents && item.continents[0]) || '';
        const subregion = item.subregion || '';
        const capital = Array.isArray(item.capital) ? item.capital.join(', ') : (item.capital || '');
        const tld = Array.isArray(item.tld) ? item.tld.join(', ') : (item.topLevelDomain || '');
        const currencies = item.currencies ? Object.values(item.currencies).map(c => c.name).join(', ') : '';
        const languages = item.languages ? Object.values(item.languages).join(', ') : '';
        const borders = item.borders || [];
        const flag = (item.flags && (item.flags.png || item.flags.svg)) ? (item.flags.png || item.flags.svg) : (item.flag || '');
        return { name, nativeName, population, region, subregion, capital, tld, currencies, languages, borders, flag };
    }

    async function tryGet(url) {
        try {
            const res = await getData(url);
            if (!res) return null;
            if (Array.isArray(res)) return res;
            if (Array.isArray(res.data)) return res.data;
            if (res.data && typeof res.data === 'object') return res.data;
            return null;
        } catch (e) {
            console.warn('tryGet failed', url, e);
            return null;
        }
    }

    async function fetchCountry(name) {
        if (!name) return null;
        const paths = [
            `${ENDPOINT}/name/${encodeURIComponent(name)}?fullText=true`,
            `${REST_ENDPOINT}/name/${encodeURIComponent(name)}?fullText=true`,
            `${REST_ENDPOINT}/name/${encodeURIComponent(name)}`
        ];
        for (const p of paths) {
            const got = await tryGet(p);
            if (got && got.length) return got[0];
        }
        return null;
    }

    function renderCountry(c) {
        if (!c) {
            detailEl.innerHTML = '<div class="text-red-500">Country not found.</div>';
            return;
        }
        const html = `
                <div class="flag w-full md:col-span-1">
                    <img src="${c.flag}" alt="flag of ${c.name}" class="w-full h-64 md:h-80 object-cover rounded-lg shadow-md" />
                </div>
                <div class="info w-full md:col-span-1">
                    <h2 class="text-3xl font-extrabold mb-6">${c.name}</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                            <li><span class="font-semibold">Native Name:</span> <span class="ml-2">${c.nativeName || '-'}</span></li>
                            <li><span class="font-semibold">Population:</span> <span class="ml-2">${c.population ? (c.population.toLocaleString ? c.population.toLocaleString() : c.population) : '-'}</span></li>
                            <li><span class="font-semibold">Region:</span> <span class="ml-2">${c.region || '-'}</span></li>
                            <li><span class="font-semibold">Sub Region:</span> <span class="ml-2">${c.subregion || '-'}</span></li>
                            <li><span class="font-semibold">Capital:</span> <span class="ml-2">${c.capital || '-'}</span></li>
                        </ul>
                        <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                            <li><span class="font-semibold">Top Level Domain:</span> <span class="ml-2">${c.tld || '-'}</span></li>
                            <li><span class="font-semibold">Currencies:</span> <span class="ml-2">${c.currencies || '-'}</span></li>
                            <li><span class="font-semibold">Languages:</span> <span class="ml-2">${c.languages || '-'}</span></li>
                        </ul>
                    </div>
                    <div class="borders">
                        <h3 class="font-semibold mb-3">Border Countries</h3>
                        <div id="borders" class="flex flex-wrap gap-3"></div>
                    </div>
                </div>
            `;
        detailEl.innerHTML = html;

        const bordersEl = document.getElementById('borders');
        if (bordersEl) {
            if (!c.borders || c.borders.length === 0) {
                bordersEl.innerHTML = '<span class="text-sm text-gray-500">None</span>';
            } else {
                c.borders.forEach(code => {
                    const btn = document.createElement('button');
                    btn.className = 'px-3 py-1 bg-white dark:bg-gray-700 rounded shadow text-sm hover:bg-gray-100 dark:hover:bg-gray-600';
                    btn.textContent = code;
                    btn.addEventListener('click', async () => {
                        setStatus('Loading border country...');
                        const alphaPaths = [`${REST_ENDPOINT}/alpha/${encodeURIComponent(code)}`];
                        let got = null;
                        for (const p of alphaPaths) {
                            const r = await tryGet(p);
                            if (r && r.length) { got = r[0]; break; }
                        }
                        if (got) {
                            const norm = normalize(got);
                            renderCountry(norm);
                            setStatus('');
                        } else {
                            setStatus('Could not load border country.', true);
                        }
                    });
                    bordersEl.appendChild(btn);
                });
            }
        }
    }

    const qName = qs('countryName') || qs('name') || '';
    if (!qName) {
        setStatus('No country specified.', true);
    } else {
        setStatus('Loading country...');
        const raw = await fetchCountry(qName);
        if (!raw) {
            setStatus('Country not found.', true);
        } else {
            const norm = normalize(raw);
            renderCountry(norm);
            setStatus('');
        }
    }
})();
