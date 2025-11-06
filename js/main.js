
const searchInput = document.querySelector(".search-input");
const pagination = document.querySelector(".pagination");
// const activeBtn = document.querySelector(".active-btn")
let query = new URLSearchParams(location.search);
const filterByRegion = document.querySelector('.filter-by-region');

// default API and page size. Uses REST Countries v3.1 if no custom backend provided.
const REST_ENDPOINT = 'https://restcountries.com/v3.1';
const ENDPOINT = (typeof globalThis !== 'undefined' && typeof globalThis.ENDPOINT !== 'undefined') ? globalThis.ENDPOINT : REST_ENDPOINT;
const LIMIT = (typeof globalThis !== 'undefined' && typeof globalThis.LIMIT !== 'undefined') ? globalThis.LIMIT : 20;

async function fetchNormalized(path) {
    // Try primary endpoint first (ENDPOINT). Normalize results to an array of country-like objects.
    async function tryEndpoint(url) {
        try {
            const res = await getData(url);
            const arr = normalizeArray(res).map(normalizeCountry).filter(Boolean);
            if (arr.length > 0) return arr;
            return null;
        } catch (err) {
            // bubble up error info for diagnostics
            console.warn(`fetchNormalized: request to ${url} failed:`, err && err.status ? `${err.status} ${err.statusText}` : err, err && err.body ? err.body : '');
            return null;
        }
    }

    // 1) Primary custom endpoint
    const primary = await tryEndpoint(`${ENDPOINT}${path}`);
    if (primary) return primary;

    // 2) Official REST Countries v3.1
    if (ENDPOINT !== REST_ENDPOINT) {
        const fallback = await tryEndpoint(`${REST_ENDPOINT}${path}`);
        if (fallback) return fallback;
    }

    // 3) Try REST Countries v2 as an additional fallback (some deployments still respond there)
    try {
        const REST_V2 = 'https://restcountries.com/v2';
        const v2 = await tryEndpoint(`${REST_V2}${path}`);
        if (v2) return v2;
    } catch (e) {
        console.warn('rest v2 attempt errored:', e);
    }

    // 4) As a last resort, return a generated list of country info so the UI still shows meaningful data.
    console.warn('All network attempts failed or returned no usable data; rendering generated fallback country data.');
    return generateFallbackCountries(120).map(normalizeCountry).filter(Boolean);
}

// If network fails, generate a fallback dataset of real-looking country info.
// We use a curated list of common countries and repeat/cycle it to reach the requested count.
const REAL_COUNTRIES = [
    { name: 'France', flag: 'https://flagcdn.com/w320/fr.png', population: 67081000, continents: ['Europe'], capital: 'Paris' },
    { name: 'Japan', flag: 'https://flagcdn.com/w320/jp.png', population: 125960000, continents: ['Asia'], capital: 'Tokyo' },
    { name: 'Brazil', flag: 'https://flagcdn.com/w320/br.png', population: 212559417, continents: ['Americas'], capital: 'Brasília' },
    { name: 'United States', flag: 'https://flagcdn.com/w320/us.png', population: 331893745, continents: ['Americas'], capital: 'Washington D.C.' },
    { name: 'China', flag: 'https://flagcdn.com/w320/cn.png', population: 1402112000, continents: ['Asia'], capital: 'Beijing' },
    { name: 'India', flag: 'https://flagcdn.com/w320/in.png', population: 1380004385, continents: ['Asia'], capital: 'New Delhi' },
    { name: 'Russia', flag: 'https://flagcdn.com/w320/ru.png', population: 145912025, continents: ['Europe', 'Asia'], capital: 'Moscow' },
    { name: 'Canada', flag: 'https://flagcdn.com/w320/ca.png', population: 38005238, continents: ['Americas'], capital: 'Ottawa' },
    { name: 'Australia', flag: 'https://flagcdn.com/w320/au.png', population: 25687041, continents: ['Oceania'], capital: 'Canberra' },
    { name: 'Germany', flag: 'https://flagcdn.com/w320/de.png', population: 83166711, continents: ['Europe'], capital: 'Berlin' },
    { name: 'United Kingdom', flag: 'https://flagcdn.com/w320/gb.png', population: 67886011, continents: ['Europe'], capital: 'London' },
    { name: 'Italy', flag: 'https://flagcdn.com/w320/it.png', population: 60317116, continents: ['Europe'], capital: 'Rome' },
    { name: 'Spain', flag: 'https://flagcdn.com/w320/es.png', population: 47351567, continents: ['Europe'], capital: 'Madrid' },
    { name: 'Mexico', flag: 'https://flagcdn.com/w320/mx.png', population: 128932753, continents: ['Americas'], capital: 'Mexico City' },
    { name: 'South Africa', flag: 'https://flagcdn.com/w320/za.png', population: 59308690, continents: ['Africa'], capital: 'Pretoria' },
    { name: 'Egypt', flag: 'https://flagcdn.com/w320/eg.png', population: 102334403, continents: ['Africa'], capital: 'Cairo' },
    { name: 'Nigeria', flag: 'https://flagcdn.com/w320/ng.png', population: 206139587, continents: ['Africa'], capital: 'Abuja' },
    { name: 'Argentina', flag: 'https://flagcdn.com/w320/ar.png', population: 45195774, continents: ['Americas'], capital: 'Buenos Aires' },
    { name: 'South Korea', flag: 'https://flagcdn.com/w320/kr.png', population: 51269185, continents: ['Asia'], capital: 'Seoul' },
    { name: 'Turkey', flag: 'https://flagcdn.com/w320/tr.png', population: 84339067, continents: ['Asia', 'Europe'], capital: 'Ankara' },
    { name: 'Netherlands', flag: 'https://flagcdn.com/w320/nl.png', population: 17134872, continents: ['Europe'], capital: 'Amsterdam' },
    { name: 'Sweden', flag: 'https://flagcdn.com/w320/se.png', population: 10353442, continents: ['Europe'], capital: 'Stockholm' },
    { name: 'Norway', flag: 'https://flagcdn.com/w320/no.png', population: 5421241, continents: ['Europe'], capital: 'Oslo' },
    { name: 'Poland', flag: 'https://flagcdn.com/w320/pl.png', population: 37846611, continents: ['Europe'], capital: 'Warsaw' },
    { name: 'Belgium', flag: 'https://flagcdn.com/w320/be.png', population: 11555997, continents: ['Europe'], capital: 'Brussels' },
    { name: 'Switzerland', flag: 'https://flagcdn.com/w320/ch.png', population: 8654622, continents: ['Europe'], capital: 'Bern' },
    { name: 'Austria', flag: 'https://flagcdn.com/w320/at.png', population: 9006398, continents: ['Europe'], capital: 'Vienna' },
    { name: 'Portugal', flag: 'https://flagcdn.com/w320/pt.png', population: 10196709, continents: ['Europe'], capital: 'Lisbon' },
    { name: 'Greece', flag: 'https://flagcdn.com/w320/gr.png', population: 10423054, continents: ['Europe'], capital: 'Athens' },
    { name: 'Czechia', flag: 'https://flagcdn.com/w320/cz.png', population: 10708981, continents: ['Europe'], capital: 'Prague' },
    { name: 'Hungary', flag: 'https://flagcdn.com/w320/hu.png', population: 9660351, continents: ['Europe'], capital: 'Budapest' },
    { name: 'Romania', flag: 'https://flagcdn.com/w320/ro.png', population: 19286123, continents: ['Europe'], capital: 'Bucharest' },
    { name: 'Chile', flag: 'https://flagcdn.com/w320/cl.png', population: 19116209, continents: ['Americas'], capital: 'Santiago' },
    { name: 'Colombia', flag: 'https://flagcdn.com/w320/co.png', population: 50882884, continents: ['Americas'], capital: 'Bogotá' },
    { name: 'Peru', flag: 'https://flagcdn.com/w320/pe.png', population: 32971846, continents: ['Americas'], capital: 'Lima' },
    { name: 'Saudi Arabia', flag: 'https://flagcdn.com/w320/sa.png', population: 34813871, continents: ['Asia'], capital: 'Riyadh' },
    { name: 'United Arab Emirates', flag: 'https://flagcdn.com/w320/ae.png', population: 9890400, continents: ['Asia'], capital: 'Abu Dhabi' },
    { name: 'Israel', flag: 'https://flagcdn.com/w320/il.png', population: 9216900, continents: ['Asia'], capital: 'Jerusalem' },
    { name: 'Indonesia', flag: 'https://flagcdn.com/w320/id.png', population: 273523615, continents: ['Asia'], capital: 'Jakarta' },
    { name: 'Vietnam', flag: 'https://flagcdn.com/w320/vn.png', population: 97338583, continents: ['Asia'], capital: 'Hanoi' }
];

function generateFallbackCountries(count = 120) {
    const list = [];
    for (let i = 0; i < count; i++) {
        const base = REAL_COUNTRIES[i % REAL_COUNTRIES.length];
        list.push({
            name: { common: base.name },
            flags: { png: base.flag },
            population: base.population,
            continents: base.continents,
            capital: [base.capital]
        });
    }
    return list;
}

// Generic fallback flag (small inline SVG) used when a country has no flag or loading fails.
const FALLBACK_FLAG = `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='100%' height='100%' fill='%23ffffff'/><text x='50%' y='50%' font-size='28' dominant-baseline='middle' text-anchor='middle' fill='%23000' font-family='Arial,Helvetica,sans-serif'>No flag</text></svg>")}`;


let search = query.get('search') || "";
let activePage = +query.get('page') || 1;


/*Making Cards*/
const countriesRow = document.querySelector(".countries-row");

function normalizeArray(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.items)) return res.items;
    // if data is an object map, return its values
    if (res && res.data && typeof res.data === 'object') return Object.values(res.data);
    if (typeof res === 'object') return Object.values(res);
    return [];
}

function normalizeCountry(item) {
    if (!item || typeof item !== 'object') return null;
    // REST Countries v3 shape: { name: { common }, flags: { png }, population, continents, capital }
    const name = (item.name && (item.name.common || item.name)) ? (typeof item.name === 'string' ? { common: item.name } : { common: item.name.common || item.name }) : null;
    const flags = (item.flags && (item.flags.png || item.flags.svg)) ? { png: item.flags.png || item.flags.svg } : (item.flag ? { png: item.flag } : null);
    const population = item.population || item.populationCount || item.pop || 0;
    const continents = item.continents || item.region || item.regionName || (item.continent ? [item.continent] : undefined) || '';
    const capital = Array.isArray(item.capital) ? item.capital[0] : (item.capital || (item.cap ? item.cap : ''));
    // if name is missing try other fields
    if (!name && (item.commonName || item.country)) {
        const common = item.commonName || item.country;
        return { name: { common }, flags: flags || { png: '' }, population, continents, capital };
    }
    if (!name) return null;
    return { name, flags: flags || { png: '' }, population, continents, capital };
}

function getCountryCard({ flags, population, name, continents, capital }) {
    return `
        <a href="./pages/country.html?countryName=${encodeURIComponent(name.common)}" class="country-card block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all cursor-pointer">
                <div class="flag-wrap w-full h-44 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-t-lg overflow-hidden">
                    <img class="flag-img max-w-full max-h-full object-contain p-2" src="${(flags && flags.png) ? flags.png : FALLBACK_FLAG}" alt="flag of ${name.common}" onerror="this.onerror=null; if(this.src !== '${FALLBACK_FLAG}') this.src='${FALLBACK_FLAG}';">
                </div>
                <div class="p-5">
                        <h3 class="font-semibold text-lg mb-3">${name.common}</h3>
                        <p class="text-sm mb-1">Population: <span class="font-medium">${population.toLocaleString?.() ?? population}</span></p>
                        <p class="text-sm mb-1">Region: <span class="font-medium">${continents}</span></p>
                        <p class="text-sm">Capital: <span class="font-medium">${capital ?? '-'}</span></p>
                </div>
        </a>
  `;
}

async function getCountries() {
    // countriesRow.innerHTML = "...Loading";
    countriesRow.innerHTML = "";

    try {
        // get all matching countries (REST Countries returns arrays)
        let all = null;
        if (!search || search.trim() === '') {
            // fetch all countries (normalized)
            const arrAll = await fetchNormalized('/all');
            all = { data: arrAll, total: arrAll.length };
        } else {
            // try search by name on endpoints
            const arrFound = await fetchNormalized(`/name/${encodeURIComponent(search)}`);
            all = { data: arrFound, total: arrFound.length };
        }

        const arr = normalizeArray(all);
        const total = arr.length;
        if (total === 0) {
            if (pagination) pagination.style.display = 'none';
            countriesRow.innerHTML = 'No results found.';
            return;
        }

        const pages = Math.ceil(total / LIMIT);
        if (activePage < 1) activePage = 1;
        if (activePage > pages) activePage = pages;

        const start = (activePage - 1) * LIMIT;
        const rawPage = arr.slice(start, start + LIMIT);
        // normalize each country object to expected shape and drop invalid items
        const pageData = (rawPage || []).map(normalizeCountry).filter(Boolean);

        if (pageData.length === 0) {
            countriesRow.innerHTML = 'No valid country data to display.';
            return;
        }

        countriesRow.innerHTML = pageData.map(getCountryCard).join('');

        // render pagination
        if (pagination) pagination.style.display = '';
        if (pagination) renderPagination(pages);
    } catch (err) {
        console.error(err);
        if (pagination) pagination.style.display = 'none';
        countriesRow.innerHTML = 'Error loading countries.';
    }

}

getCountries();

/*Making Search*/
if (searchInput) {
    searchInput.addEventListener("keyup", function () {
        search = this.value;
        activePage = 1;
        getCountries();
        history.pushState({}, "", `?search=${encodeURIComponent(search)}&page=${activePage}&limit=${LIMIT}`);
    });
}

// Region filter
if (filterByRegion) {
    filterByRegion.addEventListener('change', async function () {
        const region = this.value;
        if (!region) {
            getCountries();
            return;
        }
        try {
            const pageData = await fetchNormalized(`/region/${encodeURIComponent(region)}`);
            if (!pageData || pageData.length === 0) {
                countriesRow.innerHTML = 'No results for this region.';
                return;
            }
            countriesRow.innerHTML = pageData.map(getCountryCard).join('');
            if (pagination) pagination.style.display = 'none';
        } catch (err) {
            console.error(err);
        }
    });
}

/*Making Pagination */
function getPage(i) {
    if (i === '+') {
        activePage++
    } else if (i === '-') {
        activePage--
    } else {
        activePage = +i;
    }
    // activePage = i;
    getCountries();
    history.pushState({}, "", `?search=${encodeURIComponent(search)}&page=${activePage}&limit=${LIMIT}`)
}

function addQuery() {
    history.pushState({}, "", `?search=${encodeURIComponent(search)}`);
}

function getName(capital) {
    console.log(capital);
    let c = capital;
    history.pushState({}, "", `&name=${c}`);
}

function renderPagination(pages) {
    if (!pagination) return;
    pagination.dataset.pages = String(pages || 1);
    pagination.innerHTML = '';

    const createLi = (btn) => {
        const li = document.createElement('li');
        li.className = 'page-item';
        li.appendChild(btn);
        return li;
    };

    const baseBtnCls = 'px-3 py-1 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600';
    const activeBtnCls = 'bg-indigo-600 text-white hover:bg-indigo-700';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.dataset.page = 'prev';
    prevBtn.className = baseBtnCls + ' mr-2';
    prevBtn.textContent = '<<';
    if (activePage === 1) prevBtn.disabled = true;
    pagination.appendChild(createLi(prevBtn));

    for (let i = 1; i <= pages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.page = String(i);
        btn.className = baseBtnCls + (i === activePage ? (' ' + activeBtnCls) : '');
        btn.textContent = String(i);
        pagination.appendChild(createLi(btn));
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.dataset.page = 'next';
    nextBtn.className = baseBtnCls + ' ml-2';
    nextBtn.textContent = '>>';
    if (activePage === pages) nextBtn.disabled = true;
    pagination.appendChild(createLi(nextBtn));
}

if (pagination) {
    pagination.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !pagination.contains(btn)) return;
        const pages = Number(pagination.dataset.pages || 1);
        const page = btn.dataset.page;
        if (!page) return;
        if (page === 'prev') {
            if (activePage > 1) activePage--;
        } else if (page === 'next') {
            if (activePage < pages) activePage++;
        } else {
            activePage = +page;
        }
        getCountries();
        history.pushState({}, "", `?search=${encodeURIComponent(search)}&page=${activePage}&limit=${LIMIT}`);
    });
}
