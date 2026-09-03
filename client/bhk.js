/* ==========================================================================
   Home Price Predictor — bhk.js
   Multi-city platform shell around the existing, unmodified Bengaluru
   prediction pipeline (Flask server.py -> util.py -> pickle model).

   ARCHITECTURE
   ------------
   CITIES is the single source of truth for every city's content. Only
   Bengaluru and Chennai currently have `available: true` and real endpoint
   paths — every other city has `available: false` and `endpoint: null`.
   selectCity()
   re-renders the page from this object; nothing city-specific is hardcoded
   in bhk.html beyond element ids to populate.

   To activate a new city later (e.g. once a Mumbai model exists), the only
   change needed here is flipping that city's `available` to true and
   filling in its `endpoint`/`locationsEndpoint` — no HTML/CSS changes.
   ========================================================================== */

(function () {
  'use strict';

  var API_BASE = 'http://127.0.0.1:5000'; // Flask's port. See the note in loadCityLocations().

  /* ------------------------------------------------------------------
     City configuration — the single source of truth for page content.
     ------------------------------------------------------------------ */

  var CITIES = {
    bengaluru: {
      name: 'Bengaluru',
      epithet: 'Namma Bengaluru',
      description: "India's tech capital, known for its parks, pleasant climate, and fast-growing IT corridors. Property demand here spans legacy neighbourhoods near the city centre and booming tech-corridor suburbs.",
      available: true,
      endpoint: '/predict_home_price',            // matches server.py exactly — do not change
      locationsEndpoint: '/get_location_names',    // matches server.py exactly — do not change
      localities: [
        { name: 'Whitefield', tag: 'IT Corridor', desc: 'Sprawling tech campuses, malls, and tree-lined layouts on the eastern edge of the city.' },
        { name: 'Electronic City', tag: 'IT Hub', desc: "One of India's earliest IT hubs, anchored by major tech and software campuses." },
        { name: 'Sarjapur Road', tag: 'Growth Corridor', desc: 'A fast-growing corridor linking Whitefield and Electronic City, popular with newer developments.' },
        { name: 'Koramangala', tag: 'Startup Hub', desc: "Bengaluru's startup epicentre, dense with caf\u00e9s, co-working spaces, and young energy." },
        { name: 'Indiranagar', tag: 'Nightlife & Caf\u00e9s', desc: "Leafy residential streets that open onto some of the city's liveliest restaurants and bars." },
        { name: 'JP Nagar', tag: 'Family Friendly', desc: 'A well-established residential neighbourhood with parks, schools, and easy metro access.' },
        { name: 'Jayanagar', tag: 'Traditional Bengaluru', desc: "One of the city's oldest planned neighbourhoods \u2014 quiet, green, and deeply residential." },
        { name: 'HSR Layout', tag: 'Tech Belt', desc: 'A favourite with young professionals, sitting right along the Outer Ring Road tech corridor.' }
      ],
      landmark: 'bengaluru'
    },
    mumbai: {
      name: 'Mumbai',
      epithet: 'Aamchi Mumbai',
      description: "India's financial capital — a dense, high-energy coastal metropolis where prime real estate commands a premium. Space is scarce and vertical, from South Mumbai's heritage towers to the sprawling suburbs.",
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Andheri', tag: 'Business Hub', desc: 'A major commercial and transit hub straddling both the western and eastern suburbs.' },
        { name: 'Bandra', tag: 'Upscale & Entertainment', desc: "Mumbai's fashionable heart, known for its sea-facing promenade, boutiques, and nightlife." },
        { name: 'Powai', tag: 'IT Hub', desc: 'A planned, lake-side neighbourhood built up around IT parks and business campuses.' },
        { name: 'Borivali', tag: 'Residential', desc: 'A large residential suburb in the north, known for its proximity to Sanjay Gandhi National Park.' },
        { name: 'Thane', tag: 'Residential Suburb', desc: 'A rapidly growing satellite city just north of Mumbai, popular for more affordable housing.' },
        { name: 'Navi Mumbai', tag: 'Planned Township', desc: 'A planned twin city across the harbour, built around wide roads and modern townships.' },
        { name: 'Worli', tag: 'Upscale Residential', desc: 'A prime south-Mumbai locality lined with high-rise towers and sea-link views.' },
        { name: 'Chembur', tag: 'Residential', desc: 'A well-connected eastern suburb transitioning from industrial roots to residential towers.' }
      ],
      landmark: 'mumbai'
    },
    delhi: {
      name: 'Delhi',
      epithet: 'The Capital City',
      description: 'The national capital region — a sprawling mix of historic neighbourhoods, government districts, and expanding suburbs. Property here ranges from colonial-era bungalows to fast-growing satellite townships.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Dwarka', tag: 'Planned Sub-City', desc: "One of Asia's largest planned sub-cities, laid out in numbered residential sectors." },
        { name: 'Rohini', tag: 'Residential', desc: 'A large, well-established residential district in northwest Delhi.' },
        { name: 'Vasant Kunj', tag: 'Upscale Residential', desc: 'An upscale south Delhi neighbourhood known for its malls and embassy proximity.' },
        { name: 'Saket', tag: 'Commercial & Residential', desc: "A mixed commercial and residential hub, home to some of south Delhi's biggest malls." },
        { name: 'Greater Kailash', tag: 'Upscale Residential', desc: 'A sought-after south Delhi neighbourhood known for its markets and residential streets.' },
        { name: 'Hauz Khas', tag: 'Caf\u00e9s & Culture', desc: 'Home to Hauz Khas Village \u2014 a mix of medieval ruins, caf\u00e9s, and boutique shops.' },
        { name: 'Pitampura', tag: 'Residential', desc: 'A well-connected residential locality in northwest Delhi.' }
      ],
      landmark: 'delhi'
    },
    hyderabad: {
      name: 'Hyderabad',
      epithet: 'City of Pearls',
      description: 'A fast-growing IT and pharma hub built around a historic old city on the Deccan plateau. New residential towers now ring the Gachibowli-Hitech City corridor alongside the older city.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Gachibowli', tag: 'IT Hub', desc: "The heart of Hyderabad's IT corridor, home to major tech campuses and financial firms." },
        { name: 'Hitech City', tag: 'IT Hub', desc: "Home to Cyberabad's biggest office parks and multinational tech offices." },
        { name: 'Kondapur', tag: 'Residential', desc: 'A fast-growing residential locality just next to the IT corridor.' },
        { name: 'Madhapur', tag: 'IT Corridor', desc: 'A dense mix of IT offices, malls, and mid-rise residential towers.' },
        { name: 'Jubilee Hills', tag: 'Upscale Residential', desc: "One of Hyderabad's most upscale neighbourhoods, home to film studios and large bungalows." },
        { name: 'Banjara Hills', tag: 'Upscale Residential', desc: 'A premium residential and commercial district known for fine dining and boutiques.' },
        { name: 'Kukatpally', tag: 'Residential', desc: 'A large, well-established residential locality with strong metro connectivity.' },
        { name: 'Manikonda', tag: 'IT Belt', desc: 'A fast-growing residential belt just south of the Gachibowli IT corridor.' }
      ],
      landmark: 'hyderabad'
    },
    chennai: {
      name: 'Chennai',
      epithet: 'Gateway to South India',
      description: 'A major industrial and IT hub on the Bay of Bengal, anchored by a deep-rooted Tamil culture. The IT Corridor along OMR has reshaped much of the city\u2019s southern real estate map.',
      available: true,
      endpoint: '/predict_home_price',
      locationsEndpoint: '/get_location_names',
      localities: [
        { name: 'OMR', tag: 'IT Corridor', desc: "Chennai's IT Corridor \u2014 a long stretch of tech parks, campuses, and new apartment complexes." },
        { name: 'Adyar', tag: 'Upscale Residential', desc: 'An upscale, leafy residential neighbourhood along the Adyar river.' },
        { name: 'Anna Nagar', tag: 'Planned Residential', desc: "One of Chennai's largest planned residential neighbourhoods." },
        { name: 'Velachery', tag: 'IT & Residential', desc: 'A dense residential and IT hub with strong metro and rail connectivity.' },
        { name: 'T Nagar', tag: 'Commercial Hub', desc: "One of Chennai's busiest commercial and shopping districts." },
        { name: 'Porur', tag: 'IT & Residential', desc: "A growing residential and IT locality on the city's western edge." },
        { name: 'Sholinganallur', tag: 'IT Corridor', desc: 'A key stop along the IT Corridor, dense with tech offices and apartments.' },
        { name: 'Tambaram', tag: 'Residential', desc: "A large, established residential suburb in the city's south." }
      ],
      landmark: 'chennai'
    },
    kolkata: {
      name: 'Kolkata',
      epithet: 'City of Joy',
      description: 'A historic cultural capital blending colonial-era architecture with expanding new townships. Newer developments in Salt Lake and New Town sit alongside the city\u2019s older, established neighbourhoods.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Salt Lake', tag: 'Planned IT Township', desc: 'A planned IT township (Sector V) laid out in a clean sector grid.' },
        { name: 'New Town', tag: 'Planned Township', desc: 'A modern planned township with wide roads, IT parks, and new residential towers.' },
        { name: 'Alipore', tag: 'Upscale Residential', desc: "One of Kolkata's most upscale, leafy residential neighbourhoods." },
        { name: 'Ballygunge', tag: 'Upscale Residential', desc: 'An established, upscale south Kolkata neighbourhood.' },
        { name: 'Rajarhat', tag: 'IT & Residential', desc: "A fast-growing IT and residential belt on the city's eastern edge." },
        { name: 'Behala', tag: 'Residential', desc: 'A large, well-established residential locality in southwest Kolkata.' }
      ],
      landmark: 'kolkata'
    },
    pune: {
      name: 'Pune',
      epithet: 'Oxford of the East',
      description: 'An education and IT hub known for its pleasant climate and strong cultural heritage. Its western IT belt has driven much of the city\u2019s recent residential growth.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Hinjewadi', tag: 'IT Hub', desc: "Pune's largest IT park, home to major tech and business campuses." },
        { name: 'Kharadi', tag: 'IT Corridor', desc: "A fast-growing IT corridor on the city's eastern edge." },
        { name: 'Viman Nagar', tag: 'Residential & IT', desc: "A mixed residential and IT locality close to Pune's airport." },
        { name: 'Baner', tag: 'Residential', desc: 'A popular residential locality close to the Hinjewadi IT corridor.' },
        { name: 'Wakad', tag: 'Residential', desc: 'A fast-growing residential suburb near the IT hubs of west Pune.' },
        { name: 'Kothrud', tag: 'Residential', desc: 'A well-established, leafy residential neighbourhood in west Pune.' },
        { name: 'Hadapsar', tag: 'IT & Residential', desc: "A mixed IT and residential locality on the city's southeast side." }
      ],
      landmark: 'pune'
    },
    ahmedabad: {
      name: 'Ahmedabad',
      epithet: 'Manchester of India',
      description: "Gujarat's largest city and a fast-growing commercial and textile hub on the Sabarmati. Wide, planned corridors like SG Highway have become its newest real estate frontier.",
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Satellite', tag: 'Upscale Residential', desc: 'An upscale, well-established residential neighbourhood in west Ahmedabad.' },
        { name: 'Bopal', tag: 'Residential', desc: "A fast-growing residential suburb on the city's western edge." },
        { name: 'Prahlad Nagar', tag: 'Commercial Hub', desc: 'A commercial and residential hub known for offices and high-rises.' },
        { name: 'Thaltej', tag: 'Residential', desc: 'A well-connected residential locality in west Ahmedabad.' },
        { name: 'Chandkheda', tag: 'Residential', desc: 'A growing residential locality in the north of the city.' },
        { name: 'SG Highway', tag: 'Commercial Corridor', desc: 'A major commercial corridor lined with offices, malls, and new residential towers.' }
      ],
      landmark: 'ahmedabad'
    },
    jaipur: {
      name: 'Jaipur',
      epithet: 'The Pink City',
      description: "Rajasthan's capital, known for its palaces, forts, and distinctive planned old-city layout. Its newer residential colonies now spread well beyond the historic Pink City walls.",
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Malviya Nagar', tag: 'Residential', desc: 'A well-established residential locality in south Jaipur.' },
        { name: 'Vaishali Nagar', tag: 'Residential', desc: 'A popular, well-planned residential neighbourhood in west Jaipur.' },
        { name: 'Mansarovar', tag: 'Residential', desc: "One of Jaipur's largest planned residential colonies." },
        { name: 'Jagatpura', tag: 'Growing Suburb', desc: "A fast-growing residential suburb on the city's southeastern edge." },
        { name: 'C-Scheme', tag: 'Commercial Hub', desc: 'A central, upscale commercial and residential district.' },
        { name: 'Tonk Road', tag: 'Commercial Corridor', desc: 'A major commercial corridor connecting central Jaipur to the southern suburbs.' }
      ],
      landmark: 'jaipur'
    },
    lucknow: {
      name: 'Lucknow',
      epithet: 'City of Nawabs',
      description: 'Known for its Awadhi culture and architecture, with fast-expanding urban development. Planned neighbourhoods like Gomti Nagar have become the city\u2019s newest residential hubs.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Gomti Nagar', tag: 'Planned Residential', desc: "A large, planned residential neighbourhood on the city's east side." },
        { name: 'Hazratganj', tag: 'Commercial Hub', desc: "Lucknow's most iconic shopping and commercial street." },
        { name: 'Aliganj', tag: 'Residential', desc: 'A well-established residential locality in central Lucknow.' },
        { name: 'Indira Nagar', tag: 'Residential', desc: 'A large, established residential neighbourhood in east Lucknow.' },
        { name: 'Sushant Golf City', tag: 'Growing Suburb', desc: "A newer planned township on the city's southeastern edge." },
        { name: 'Faizabad Road', tag: 'Growth Corridor', desc: "A fast-growing corridor connecting Lucknow to its eastern suburbs." }
      ],
      landmark: 'lucknow'
    },
    chandigarh: {
      name: 'Chandigarh',
      epithet: 'The City Beautiful',
      description: 'India\u2019s first planned modern city, laid out in numbered sectors with wide boulevards and green spaces. Its sector-based grid makes it one of India\u2019s most orderly property markets.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Sector 17', tag: 'Commercial Hub', desc: "Chandigarh's central plaza and main commercial hub." },
        { name: 'Sector 22', tag: 'Residential', desc: 'A well-established, centrally located residential sector.' },
        { name: 'Sector 34', tag: 'Commercial', desc: 'A busy commercial sector with markets and offices.' },
        { name: 'Sector 35', tag: 'Residential', desc: 'A well-established residential sector close to the city centre.' },
        { name: 'Sector 43', tag: 'Residential', desc: 'A residential sector known for its bus terminal and connectivity.' },
        { name: 'Zirakpur', tag: 'Growing Suburb', desc: 'A fast-growing satellite town just south of Chandigarh.' }
      ],
      landmark: 'chandigarh'
    },
    kochi: {
      name: 'Kochi',
      epithet: 'Queen of the Arabian Sea',
      description: "Kerala's commercial hub, known for its port, backwaters, and coastal charm. Its IT corridor around Kakkanad has become a major draw for newer residential development.",
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'Kakkanad', tag: 'IT Hub', desc: "Kochi's IT hub, home to major tech parks and business campuses." },
        { name: 'Edappally', tag: 'Commercial Hub', desc: 'A major commercial junction and shopping hub in central Kochi.' },
        { name: 'Vyttila', tag: 'Transit Hub', desc: "A key transit hub linking the city's mobility network." },
        { name: 'Kaloor', tag: 'Commercial', desc: 'A busy commercial locality close to the city centre.' },
        { name: 'Fort Kochi', tag: 'Heritage & Coastal', desc: 'A historic, heritage-rich coastal neighbourhood known for colonial architecture.' },
        { name: 'Marine Drive', tag: 'Waterfront', desc: 'A scenic waterfront promenade lined with restaurants and residential towers.' },
        { name: 'Aluva', tag: 'Growing Suburb', desc: "A fast-growing suburb on the city's northeastern edge, near the airport." }
      ],
      landmark: 'kochi'
    },
    vizag: {
      name: 'Vizag',
      epithet: 'City of Destiny',
      description: 'Andhra Pradesh\u2019s largest city, spread along a dramatic Bay of Bengal coastline. Its coastal and IT-corridor neighbourhoods have both seen fast-growing residential interest.',
      available: false,
      endpoint: null,
      locationsEndpoint: null,
      localities: [
        { name: 'MVP Colony', tag: 'Upscale Residential', desc: 'An upscale, well-established residential neighbourhood.' },
        { name: 'Madhurawada', tag: 'IT Corridor', desc: "A fast-growing IT corridor on the city's northern edge." },
        { name: 'Gajuwaka', tag: 'Industrial', desc: 'An industrial hub anchored by the steel plant and surrounding suburbs.' },
        { name: 'Seethammadhara', tag: 'Residential', desc: 'A well-established, central residential locality.' },
        { name: 'Dwaraka Nagar', tag: 'Commercial Hub', desc: "The city's main commercial and shopping district." },
        { name: 'Rushikonda', tag: 'Beachfront', desc: 'A scenic beachfront locality known for its coastline and resorts.' },
        { name: 'Yendada', tag: 'Growing Suburb', desc: "A fast-growing residential suburb on the city's northern edge." }
      ],
      landmark: 'vizag'
    }
  };

  var CITY_ORDER = ['bengaluru', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'kochi', 'vizag'];

  /* ------------------------------------------------------------------
     Landmark illustrations — one per city. Each uses its own light-to-dark
     material gradient (that city's real stone/metal/wood colour, shaded
     rather than flat) for structural mass, plus flat accent colours for
     highlights, water, and small detail. heroVisualShell() wraps every
     one with a shared sunset sky, a faint distant skyline, and a couple
     of birds, so all 13 read as one consistent scene rather than an
     object floating on a gradient.
     ------------------------------------------------------------------ */

  function materialGradient(light, dark) {
    return '<defs><linearGradient id="matGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + light + '"/>' +
      '<stop offset="100%" stop-color="' + dark + '"/>' +
      '</linearGradient></defs>';
  }

  var LANDMARKS = {
    // Vidhana Soudha — shaded grey granite, colonnaded base, central dome, two flanking cupolas
    bengaluru:
      materialGradient('#D9E2DE', '#748680') +
      '<rect x="55" y="228" width="330" height="72" fill="url(#matGrad)"/>' +
      '<g stroke-width="1.2">' +
      '<line x1="70" y1="228" x2="70" y2="300"/><line x1="95" y1="228" x2="95" y2="300"/>' +
      '<line x1="120" y1="228" x2="120" y2="300"/><line x1="145" y1="228" x2="145" y2="300"/>' +
      '<line x1="170" y1="228" x2="170" y2="300"/><line x1="270" y1="228" x2="270" y2="300"/>' +
      '<line x1="295" y1="228" x2="295" y2="300"/><line x1="320" y1="228" x2="320" y2="300"/>' +
      '<line x1="345" y1="228" x2="345" y2="300"/><line x1="368" y1="228" x2="368" y2="300"/>' +
      '</g>' +
      '<path d="M165 188 L220 163 L275 188 Z" fill="url(#matGrad)"/>' +
      '<rect x="165" y="188" width="110" height="42" fill="url(#matGrad)"/>' +
      '<g stroke-width="1.2"><line x1="182" y1="188" x2="182" y2="230"/><line x1="202" y1="188" x2="202" y2="230"/>' +
      '<line x1="238" y1="188" x2="238" y2="230"/><line x1="258" y1="188" x2="258" y2="230"/></g>' +
      '<rect x="188" y="145" width="64" height="40" fill="url(#matGrad)"/>' +
      '<path d="M188 145 A32 32 0 0 1 252 145 Z" fill="url(#matGrad)"/>' +
      '<g stroke-width="1"><path d="M204 145 A16 32 0 0 1 206 116"/><path d="M220 145 V113"/><path d="M236 145 A16 32 0 0 1 234 116"/></g>' +
      '<line x1="220" y1="113" x2="220" y2="96"/><circle cx="220" cy="90" r="4.5" fill="#D9603A"/>' +
      '<rect x="118" y="178" width="30" height="24" fill="url(#matGrad)"/>' +
      '<path d="M118 178 A15 15 0 0 1 148 178 Z" fill="url(#matGrad)"/>' +
      '<line x1="133" y1="163" x2="133" y2="152"/><circle cx="133" cy="149" r="3" fill="#D9603A"/>' +
      '<rect x="292" y="178" width="30" height="24" fill="url(#matGrad)"/>' +
      '<path d="M292 178 A15 15 0 0 1 322 178 Z" fill="url(#matGrad)"/>' +
      '<line x1="307" y1="163" x2="307" y2="152"/><circle cx="307" cy="149" r="3" fill="#D9603A"/>' +
      '<g opacity="0.5"><path d="M40 300 Q46 280 42 262" stroke="#3F5A46" stroke-width="3"/><path d="M400 300 Q394 282 398 264" stroke="#3F5A46" stroke-width="3"/></g>' +
      '<rect x="45" y="300" width="350" height="8" fill="#5A6D66"/>' +
      '<rect x="35" y="308" width="370" height="8" fill="#465751"/>',

    // Gateway of India — shaded ochre basalt, dome integrated at the peak, turrets at the shoulders, turquoise sea
    mumbai:
      materialGradient('#F3CC7A', '#9E6C24') +
      '<path d="M155 300 V160 A65 65 0 0 1 285 160 V300 Z" fill="url(#matGrad)"/>' +
      '<path d="M180 300 V195 A40 40 0 0 1 260 195 V300"/>' +
      '<rect x="200" y="76" width="40" height="20" fill="url(#matGrad)"/>' +
      '<path d="M200 76 A20 22 0 0 1 240 76 Z" fill="url(#matGrad)"/>' +
      '<line x1="220" y1="54" x2="220" y2="38"/><circle cx="220" cy="33" r="4" fill="#FBEFD2"/>' +
      '<circle cx="178" cy="150" r="9" fill="url(#matGrad)"/><line x1="178" y1="141" x2="178" y2="128"/><circle cx="178" cy="124" r="2.5" fill="#FBEFD2"/>' +
      '<circle cx="262" cy="150" r="9" fill="url(#matGrad)"/><line x1="262" y1="141" x2="262" y2="128"/><circle cx="262" cy="124" r="2.5" fill="#FBEFD2"/>' +
      '<g stroke-width="1"><circle cx="190" cy="215" r="3"/><circle cx="250" cy="215" r="3"/></g>' +
      '<rect x="130" y="300" width="180" height="10" fill="url(#matGrad)"/>' +
      '<rect x="115" y="310" width="210" height="8" fill="#7A5A1E"/>' +
      '<path d="M30 322 Q90 312 150 322 T270 322 T390 322" stroke="#2FB0AC" stroke-width="1.3"/>' +
      '<path d="M30 334 Q90 326 150 334 T270 334 T390 334" stroke="#2FB0AC" stroke-width="1.3"/>' +
      '<path d="M330 316 L370 316 L362 324 L338 324 Z" fill="url(#matGrad)"/>' +
      '<line x1="352" y1="316" x2="352" y2="300"/><path d="M352 300 L364 314 L352 314 Z" fill="url(#matGrad)"/>',

    // India Gate — shaded red sandstone, a solitary arch on a stepped plinth
    delhi:
      materialGradient('#E6A181', '#98432D') +
      '<path d="M160 300 V150 A60 60 0 0 1 280 150 V300 Z" fill="url(#matGrad)"/>' +
      '<path d="M186 300 V185 A34 34 0 0 1 254 185 V300"/>' +
      '<line x1="160" y1="230" x2="186" y2="230"/><line x1="254" y1="230" x2="280" y2="230"/>' +
      '<g stroke-width="1"><line x1="164" y1="200" x2="276" y2="200"/><line x1="164" y1="210" x2="276" y2="210"/></g>' +
      '<rect x="140" y="300" width="160" height="10" fill="url(#matGrad)"/>' +
      '<rect x="125" y="310" width="190" height="8" fill="#7A3F2C"/>' +
      '<rect x="112" y="320" width="216" height="8" fill="#602F20"/>' +
      '<line x1="220" y1="150" x2="220" y2="126"/><circle cx="220" cy="120" r="4" fill="#FBEFD2"/>',

    // Charminar — shaded pale grey-green granite, four bold minarets with bulbous domes, grand central arch
    hyderabad:
      materialGradient('#E2E5D2', '#8A9576') +
      (function () {
        var out = '';
        var minarets = [{ cx: 78, topY: 145, w: 18 }, { cx: 172, topY: 108, w: 20 }, { cx: 268, topY: 108, w: 20 }, { cx: 362, topY: 145, w: 18 }];
        minarets.forEach(function (m) {
          var h = 300 - m.topY, hw = m.w / 2;
          out += '<rect x="' + (m.cx - hw) + '" y="' + m.topY + '" width="' + m.w + '" height="' + h + '" fill="url(#matGrad)"/>';
          out += '<rect x="' + (m.cx - hw - 3) + '" y="' + (m.topY + h * 0.32) + '" width="' + (m.w + 6) + '" height="5" fill="url(#matGrad)"/>';
          out += '<rect x="' + (m.cx - hw - 3) + '" y="' + (m.topY + h * 0.64) + '" width="' + (m.w + 6) + '" height="5" fill="url(#matGrad)"/>';
          out += '<path d="M' + (m.cx - hw - 2) + ' ' + m.topY + ' C ' + (m.cx - hw - 9) + ' ' + (m.topY - 12) + ', ' + (m.cx - hw * 0.5) + ' ' + (m.topY - 28) + ', ' + m.cx + ' ' + (m.topY - 32) +
            ' C ' + (m.cx + hw * 0.5) + ' ' + (m.topY - 28) + ', ' + (m.cx + hw + 9) + ' ' + (m.topY - 12) + ', ' + (m.cx + hw + 2) + ' ' + m.topY + ' Z" fill="url(#matGrad)"/>';
          out += '<line x1="' + m.cx + '" y1="' + (m.topY - 32) + '" x2="' + m.cx + '" y2="' + (m.topY - 46) + '"/><circle cx="' + m.cx + '" cy="' + (m.topY - 49) + '" r="3" fill="#FBEFD2"/>';
        });
        return out;
      })() +
      '<rect x="165" y="205" width="110" height="95" fill="url(#matGrad)"/>' +
      '<path d="M183 300 V237 A37 37 0 0 1 257 237 V300"/>' +
      '<g stroke-width="1.1"><path d="M165 205 A24 22 0 0 1 209 205"/><path d="M213 205 A11 22 0 0 1 227 205"/><path d="M231 205 A24 22 0 0 1 275 205"/></g>' +
      '<circle cx="220" cy="222" r="8" fill="none" stroke-width="1"/>' +
      '<g stroke-width="1"><path d="M165 205 h10 v-8 h9 v8 h9 v-8 h9 v8 h9 v-8 h9 v8 h9 v-8 h9 v8 h10"/></g>',

    // Gopuram — a stepped temple tower painted in the vivid multi-colour palette real gopurams use
    chennai:
      (function () {
        var tiers = [
          { yb: 300, yt: 275, wb: 112, wt: 96, c1: '#D96A54', c2: '#A0392A' },
          { yb: 275, yt: 252, wb: 96, wt: 82, c1: '#5AA6C4', c2: '#2C5E76' },
          { yb: 252, yt: 231, wb: 82, wt: 70, c1: '#4FAF8E', c2: '#256150' },
          { yb: 231, yt: 212, wb: 70, wt: 58, c1: '#EBC066', c2: '#A9782A' },
          { yb: 212, yt: 195, wb: 58, wt: 46, c1: '#D07FA8', c2: '#8E4166' },
          { yb: 195, yt: 180, wb: 46, wt: 34, c1: '#F0E4C0', c2: '#B7A26E' }
        ];
        var cx = 220, out = '';
        tiers.forEach(function (t, i) {
          var gid = 'tier' + i;
          out += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="' + t.c1 + '"/><stop offset="100%" stop-color="' + t.c2 + '"/></linearGradient></defs>';
          var x1b = cx - t.wb / 2, x2b = cx + t.wb / 2, x1t = cx - t.wt / 2, x2t = cx + t.wt / 2;
          out += '<path d="M' + x1b + ' ' + t.yb + ' L' + x2b + ' ' + t.yb + ' L' + x2t + ' ' + t.yt + ' L' + x1t + ' ' + t.yt + ' Z" fill="url(#' + gid + ')"/>';
          var nicheCount = 5 - Math.min(i, 3);
          for (var n = 0; n < nicheCount; n++) {
            var nx = x1b + (x2b - x1b) * (n + 0.5) / nicheCount;
            out += '<line x1="' + nx + '" y1="' + (t.yb - 4) + '" x2="' + nx + '" y2="' + (t.yb - 11) + '" stroke-width="1"/>';
          }
        });
        out += '<path d="M204 180 L236 180 L220 160 Z" fill="#EBC066"/>';
        out += '<circle cx="220" cy="153" r="5" fill="#FBEFD2"/>';
        out += '<rect x="195" y="300" width="50" height="10" fill="#8A5A38"/>';
        return out;
      })(),

    // Howrah Bridge — shaded grey steel, a dense cantilever truss between two pylons, muddy river
    kolkata:
      materialGradient('#C7D8E1', '#5C7686') +
      '<rect x="82" y="140" width="22" height="160" fill="url(#matGrad)"/>' +
      '<rect x="336" y="140" width="22" height="160" fill="url(#matGrad)"/>' +
      '<g stroke-width="1.3">' +
      '<path d="M104 155 L150 190 L196 155 L242 190 L288 155 L336 190"/>' +
      '<path d="M104 185 L150 155 L196 185 L242 155 L288 185 L336 155"/>' +
      '<path d="M104 210 L150 235 L196 210 L242 235 L288 210 L336 235"/>' +
      '<path d="M104 240 L150 210 L196 240 L242 210 L288 240 L336 210"/>' +
      '</g>' +
      '<rect x="82" y="245" width="276" height="10" fill="url(#matGrad)"/>' +
      '<path d="M40 300 Q95 290 150 300 T260 300 T370 300 T410 300" stroke="#6B7A4A" stroke-width="1.3"/>' +
      '<path d="M40 312 Q95 304 150 312 T260 312 T370 312 T410 312" stroke="#6B7A4A" stroke-width="1.3"/>' +
      '<path d="M395 296 L420 296 L412 304 L400 304 Z" fill="url(#matGrad)"/>',

    // Shaniwar Wada — shaded red laterite stone, fortified gate, bastion towers, iron-studded door
    pune:
      materialGradient('#E29368', '#8A3F26') +
      '<rect x="95" y="205" width="65" height="95" fill="url(#matGrad)"/>' +
      '<rect x="280" y="205" width="65" height="95" fill="url(#matGrad)"/>' +
      '<g stroke-width="1.1"><path d="M95 205 h11 v-9 h11 v9 h11 v-9 h11 v9 h11 v-9 h10"/></g>' +
      '<g stroke-width="1.1"><path d="M280 205 h11 v-9 h11 v9 h11 v-9 h11 v9 h11 v-9 h10"/></g>' +
      '<path d="M170 300 V185 A50 50 0 0 1 270 185 V300 Z" fill="url(#matGrad)"/>' +
      '<path d="M188 300 V210 A32 32 0 0 1 252 210 V300"/>' +
      '<g stroke-width="1">' +
      '<circle cx="196" cy="230" r="2.5" fill="#3A2810"/><circle cx="196" cy="250" r="2.5" fill="#3A2810"/><circle cx="196" cy="270" r="2.5" fill="#3A2810"/>' +
      '<circle cx="220" cy="220" r="2.5" fill="#3A2810"/><circle cx="220" cy="240" r="2.5" fill="#3A2810"/><circle cx="220" cy="260" r="2.5" fill="#3A2810"/><circle cx="220" cy="280" r="2.5" fill="#3A2810"/>' +
      '<circle cx="244" cy="230" r="2.5" fill="#3A2810"/><circle cx="244" cy="250" r="2.5" fill="#3A2810"/><circle cx="244" cy="270" r="2.5" fill="#3A2810"/>' +
      '</g>' +
      '<rect x="75" y="300" width="290" height="8" fill="#6B331C"/>',

    // Sidi Saiyyed jali — shaded cream sandstone, a grand arch containing a dense branching "tree of life" lattice
    ahmedabad:
      materialGradient('#F5E8C2', '#B0925A') +
      '<path d="M140 300 V150 A80 80 0 0 1 300 150 V300 Z" fill="url(#matGrad)"/>' +
      '<path d="M140 300 V150 A80 80 0 0 1 300 150 V300"/>' +
      '<g stroke-width="1.3">' +
      '<line x1="220" y1="300" x2="220" y2="178"/>' +
      '<path d="M220 285 L188 255 M220 285 L252 255 M220 258 L192 232 M220 258 L248 232 M220 232 L196 210 M220 232 L244 210 M220 208 L200 188 M220 208 L240 188 M220 186 L204 172 M220 186 L236 172"/>' +
      '<path d="M220 272 L198 288 M220 272 L242 288 M220 246 L200 262 M220 246 L240 262 M220 220 L202 234 M220 220 L238 234 M220 197 L206 208 M220 197 L234 208"/>' +
      '</g>' +
      '<g stroke-width="0.9">' +
      '<path d="M188 255 L172 240 M188 255 L178 270 M252 255 L268 240 M252 255 L262 270"/>' +
      '<path d="M192 232 L178 220 M248 232 L262 220"/>' +
      '</g>' +
      '<path d="M150 172 Q220 142 290 172" stroke-width="1"/>' +
      '<path d="M155 158 Q220 132 285 158" stroke-width="1"/>',

    // Hawa Mahal — shaded rose-pink sandstone, a dense honeycomb facade of jharokha windows
    jaipur:
      materialGradient('#F5B9B9', '#B85D5D') +
      '<rect x="110" y="130" width="220" height="170" fill="url(#matGrad)"/>' +
      '<path d="M110 130 Q128 116 146 130 T182 130 T218 130 T254 130 T290 130 T326 130" stroke-width="1.2"/>' +
      (function () {
        var rows = [155, 182, 209, 236, 263];
        var cols = [130, 160, 190, 220, 250, 280, 310];
        var out = '';
        rows.forEach(function (y) {
          cols.forEach(function (x) {
            out += '<path d="M' + (x - 7) + ' ' + (y + 9) + ' V' + y + ' A7 7 0 0 1 ' + (x + 7) + ' ' + y + ' V' + (y + 9) + '" stroke-width="1"/>';
          });
        });
        return out;
      })() +
      '<g stroke-width="1"><path d="M118 130 v-10 M150 130 v-10 M182 130 v-10 M214 130 v-10 M246 130 v-10 M278 130 v-10 M322 130 v-10"/></g>',

    // Rumi Darwaza — shaded warm terracotta, a tall gateway with a scalloped crown and side turrets
    lucknow:
      materialGradient('#EDB27E', '#A3673A') +
      '<path d="M165 300 V205 Q165 150 195 150 Q207 128 220 150 Q233 128 245 150 Q275 150 275 205 V300 Z" fill="url(#matGrad)"/>' +
      '<path d="M190 300 V235 A30 30 0 0 1 250 235 V300"/>' +
      '<g stroke-width="1.1">' +
      '<path d="M172 200 Q185 180 200 195 Q207 175 220 192 Q233 175 240 195 Q255 180 268 200"/>' +
      '<path d="M178 178 Q190 162 202 176 Q210 158 220 174 Q230 158 238 176 Q250 162 262 178"/>' +
      '</g>' +
      '<line x1="145" y1="215" x2="145" y2="300" stroke-width="1.5"/><circle cx="145" cy="203" r="9" fill="url(#matGrad)"/><line x1="145" y1="194" x2="145" y2="182"/><circle cx="145" cy="178" r="2.5" fill="#FBEFD2"/>' +
      '<line x1="295" y1="215" x2="295" y2="300" stroke-width="1.5"/><circle cx="295" cy="203" r="9" fill="url(#matGrad)"/><line x1="295" y1="194" x2="295" y2="182"/><circle cx="295" cy="178" r="2.5" fill="#FBEFD2"/>' +
      '<g stroke-width="1"><path d="M165 300 h-15 M275 300 h15"/></g>',

    // Open Hand Monument — shaded dark rotating sheet metal, on a pivot, with a faint sector-grid backdrop
    chandigarh:
      materialGradient('#AEB3B5', '#54585B') +
      '<g stroke-opacity="0.3" stroke-width="1">' +
      '<line x1="90" y1="130" x2="90" y2="300"/><line x1="160" y1="110" x2="160" y2="300"/>' +
      '<line x1="280" y1="110" x2="280" y2="300"/><line x1="350" y1="130" x2="350" y2="300"/>' +
      '<line x1="70" y1="175" x2="370" y2="175"/><line x1="70" y1="245" x2="370" y2="245"/>' +
      '</g>' +
      '<line x1="220" y1="300" x2="220" y2="268" stroke-width="3"/>' +
      '<path d="M195 300 L245 300 L235 308 L205 308 Z" fill="url(#matGrad)"/>' +
      '<rect x="193" y="218" width="54" height="50" rx="16" fill="url(#matGrad)"/>' +
      '<rect x="190" y="182" width="10" height="38" rx="5" fill="url(#matGrad)" transform="rotate(-45 195 220)"/>' +
      '<rect x="200" y="168" width="10" height="52" rx="5" fill="url(#matGrad)" transform="rotate(-12 205 220)"/>' +
      '<rect x="215" y="162" width="10" height="58" rx="5" fill="url(#matGrad)"/>' +
      '<rect x="230" y="170" width="10" height="50" rx="5" fill="url(#matGrad)" transform="rotate(10 235 220)"/>' +
      '<rect x="243" y="180" width="10" height="40" rx="5" fill="url(#matGrad)" transform="rotate(24 248 220)"/>',

    // Chinese fishing nets — shaded warm wood poles, dark net mesh, over vivid turquoise water
    kochi:
      materialGradient('#CBA05A', '#6E4B22') +
      '<line x1="130" y1="300" x2="205" y2="140" stroke-width="2.5"/>' +
      '<line x1="205" y1="140" x2="335" y2="165" stroke-width="2.5"/>' +
      '<line x1="130" y1="225" x2="235" y2="252"/>' +
      '<line x1="130" y1="260" x2="248" y2="280"/>' +
      '<path d="M205 140 L335 165 L252 272 L205 205 Z" fill="url(#matGrad)" fill-opacity="0.6"/>' +
      '<g stroke-width="0.8">' +
      '<line x1="215" y1="160" x2="270" y2="230"/><line x1="235" y1="155" x2="285" y2="220"/><line x1="255" y1="152" x2="300" y2="205"/>' +
      '<line x1="220" y1="180" x2="300" y2="195"/><line x1="222" y1="205" x2="290" y2="215"/>' +
      '</g>' +
      '<line x1="235" y1="252" x2="185" y2="288"/><circle cx="185" cy="294" r="5" fill="#3A2810"/>' +
      '<line x1="248" y1="280" x2="205" y2="298"/>' +
      '<path d="M30 300 Q85 291 140 300 T250 300 T350 300 T410 300" stroke="#2FB0AC" stroke-width="1.3"/>' +
      '<path d="M30 312 Q85 305 140 312 T250 312 T350 312 T410 312" stroke="#2FB0AC" stroke-width="1.3"/>',

    // Coastline — shaded green Kailasagiri hill, a red-and-white lighthouse, and turquoise waves
    vizag:
      materialGradient('#8FC280', '#4E7645') +
      '<path d="M40 300 Q130 195 240 300 Z" fill="url(#matGrad)"/>' +
      '<path d="M40 300 Q130 195 240 300"/>' +
      '<circle cx="150" cy="255" r="3" fill="#F0DFAF"/>' +
      '<rect x="298" y="182" width="14" height="17.5" fill="#D64B3D"/>' +
      '<rect x="298" y="199.5" width="14" height="17.5" fill="#EDE6D2"/>' +
      '<rect x="298" y="217" width="14" height="17.5" fill="#D64B3D"/>' +
      '<rect x="298" y="234.5" width="14" height="17.5" fill="#EDE6D2"/>' +
      '<path d="M296 182 h18"/><path d="M300 168 h10"/><path d="M305 182 v-14"/>' +
      '<circle cx="305" cy="173" r="5" fill="#FBEFD2"/>' +
      '<g stroke-width="1"><line x1="298" y1="200" x2="312" y2="200"/><line x1="298" y1="218" x2="312" y2="218"/><line x1="298" y1="236" x2="312" y2="236"/></g>' +
      '<path d="M20 300 Q80 289 140 300 T260 300 T360 300 T410 300" stroke="#2FB0AC" stroke-width="1.3"/>' +
      '<path d="M20 313 Q80 304 140 313 T260 313 T360 313 T410 313" stroke="#2FB0AC" stroke-width="1.3"/>' +
      '<path d="M20 326 Q80 318 140 326 T260 326 T360 326 T410 326" stroke="#2FB0AC" stroke-width="1.3"/>'
  };

  function heroVisualShell(innerSvg) {
    // The sky gradient and sun glow now live in CSS on .hero (they were
    // always identical across cities anyway, so nothing is lost) -- this
    // lets the atmosphere stretch full-bleed with zero risk of cropping.
    // preserveAspectRatio="xMaxYMax meet" scales the illustration to fit
    // entirely within frame (never cropped, so domes/finials survive any
    // aspect ratio) and anchors it to the bottom-right, matching where
    // the CSS glow is positioned.
    return '<svg viewBox="0 0 440 360" preserveAspectRatio="xMaxYMax meet" class="landmark-svg">' +
      '<defs>' +
      '<radialGradient id="groundShadow" cx="220" cy="300" r="170" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0%" stop-color="#000000" stop-opacity="0.32"/>' +
      '<stop offset="100%" stop-color="#000000" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<g stroke="#3A2410" stroke-width="1.2" fill="none" opacity="0.55">' +
      '<path d="M150 62 q5 -6 10 0 q5 -6 10 0"/>' +
      '<path d="M285 44 q4 -5 8 0 q4 -5 8 0"/>' +
      '</g>' +
      '<g opacity="0.16" fill="#3A2410">' +
      '<rect x="14" y="272" width="16" height="28"/><rect x="34" y="255" width="13" height="45"/><rect x="51" y="280" width="18" height="20"/>' +
      '<rect x="362" y="265" width="15" height="35"/><rect x="381" y="278" width="20" height="22"/><rect x="405" y="250" width="12" height="50"/>' +
      '</g>' +
      '<ellipse cx="220" cy="300" rx="180" ry="32" fill="url(#groundShadow)"/>' +
      '<g class="landmark-illustration" stroke="#3A2410" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      innerSvg +
      '</g>' +
      '</svg>';
  }

  /* ------------------------------------------------------------------
     DOM references
     ------------------------------------------------------------------ */

  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  var citySelector = document.getElementById('citySelector');
  var citySelectorBtn = document.getElementById('citySelectorBtn');
  var citySelectorLabel = document.getElementById('citySelectorLabel');
  var citySelectorPanel = document.getElementById('citySelectorPanel');

  var heroContent = document.getElementById('heroContent');
  var heroEyebrow = document.getElementById('heroEyebrow');
  var heroCityName = document.getElementById('heroCityName');
  var heroDescription = document.getElementById('heroDescription');
  var heroCtaLabel = document.getElementById('heroCtaLabel');
  var heroCta = document.getElementById('heroCta');
  var heroMeta = document.getElementById('heroMeta');
  var heroVisual = document.getElementById('heroVisual');

  var globalAlert = document.getElementById('globalAlert');

  var predictorLive = document.getElementById('predictorLive');
  var predictorComingSoon = document.getElementById('predictorComingSoon');
  var comingSoonTitle = document.getElementById('comingSoonTitle');
  var comingSoonText = document.getElementById('comingSoonText');

  var form = document.getElementById('predictionForm');
  var locationSelect = document.getElementById('locationSelect');
  var sqftInput = document.getElementById('sqftInput');
  var bhkSelect = document.getElementById('bhkSelect');
  var bathSelect = document.getElementById('bathSelect');
  var predictBtn = document.getElementById('predictBtn');

  var resultCard = document.getElementById('resultCard');
  var resultPrice = document.getElementById('resultPrice');
  var pricePerSqftEl = document.getElementById('pricePerSqft');
  var summaryLocation = document.getElementById('summaryLocation');
  var summarySqft = document.getElementById('summarySqft');
  var summaryBhk = document.getElementById('summaryBhk');
  var summaryBath = document.getElementById('summaryBath');

  var emiRateInput = document.getElementById('emiRate');
  var emiTenureSelect = document.getElementById('emiTenure');
  var emiValueEl = document.getElementById('emiValue');

  var localitiesCityName = document.getElementById('localitiesCityName');
  var localitiesText = document.getElementById('localitiesText');
  var localitiesGrid = document.getElementById('localitiesGrid');

  var selectedCityKey = 'bengaluru';
  var currentLoanPrincipal = null;      // last predicted price in rupees, for the EMI panel
  var locationCountsByCity = {};        // city -> number of locations returned by the model
  var locationOptionsByCity = {};       // city -> raw location list from the API

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupMobileNav();
    setupCitySelector();
    form.addEventListener('submit', handlePredictSubmit);
    emiRateInput.addEventListener('input', updateEmi);
    emiTenureSelect.addEventListener('change', updateEmi);

    var startCity = getCityFromUrl();
    selectCity(CITIES[startCity] ? startCity : 'bengaluru');
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */

  function setupMobileNav() {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------
     City selector
     ------------------------------------------------------------------ */

  function setupCitySelector() {
    citySelectorPanel.innerHTML = ''; // guard against double-initialization

    CITY_ORDER.forEach(function (key) {
      var city = CITIES[key];
      var li = document.createElement('li');
      li.className = 'city-option';
      li.setAttribute('role', 'option');
      li.dataset.city = key;
      li.setAttribute('aria-selected', key === selectedCityKey ? 'true' : 'false');

      var nameSpan = document.createElement('span');
      nameSpan.textContent = city.name;
      li.appendChild(nameSpan);

      if (!city.available) {
        var tag = document.createElement('span');
        tag.className = 'city-option-tag';
        tag.textContent = 'Soon';
        li.appendChild(tag);
      }

      li.addEventListener('click', function () {
        selectCity(key);
        closeCityPanel();
      });

      citySelectorPanel.appendChild(li);
    });

    citySelectorBtn.addEventListener('click', function () {
      var isOpen = citySelector.classList.toggle('is-open');
      citySelectorBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (event) {
      if (!citySelector.contains(event.target)) closeCityPanel();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeCityPanel();
    });
  }

  function closeCityPanel() {
    citySelector.classList.remove('is-open');
    citySelectorBtn.setAttribute('aria-expanded', 'false');
  }

  function getCityFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var city = (params.get('city') || '').toLowerCase().trim();
    return city;
  }

  /* ------------------------------------------------------------------
     Rendering a selected city across the whole page
     ------------------------------------------------------------------ */

  function selectCity(key) {
    var city = CITIES[key];
    if (!city) return;
    selectedCityKey = key;

    fadeSwap(heroContent, function () {
      citySelectorLabel.textContent = city.name;
      heroEyebrow.textContent = city.epithet;
      heroCityName.textContent = city.name;
      heroDescription.textContent = city.description;
      heroCtaLabel.textContent = city.available ? 'Predict Home Price' : ('Explore ' + city.name);
      heroCta.setAttribute('href', city.available ? '#predictor' : '#localities');

      if (locationCountsByCity[key] !== undefined) {
        setHeroMeta(key, locationCountsByCity[key]);
      } else {
        heroMeta.textContent = '';
      }
    });

    fadeSwap(heroVisual, function () {
      heroVisual.innerHTML = heroVisualShell(LANDMARKS[city.landmark] || '');
    });

    fadeSwap(localitiesGrid, function () { renderLocalities(city); });
    localitiesCityName.textContent = city.name;

    hideGlobalAlert();
    resetPredictionState();

    if (city.available) {
      predictorLive.classList.remove('is-hidden');
      predictorComingSoon.classList.add('is-hidden');
      loadCityLocations(key);
    } else {
      predictorLive.classList.add('is-hidden');
      predictorComingSoon.classList.remove('is-hidden');
      comingSoonTitle.textContent = city.name + ' Property Prediction';
      comingSoonText.textContent = 'Our ' + city.name + ' property prediction model is currently under development. Explore ' + city.name + '\u2019s popular localities below while we prepare the model.';
    }

    citySelectorPanel.querySelectorAll('.city-option').forEach(function (li) {
      var isSelected = li.dataset.city === key;
      li.classList.toggle('is-selected', isSelected);
      li.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    var url = new URL(window.location.href);
    url.searchParams.set('city', key);
    window.history.replaceState(null, '', url.toString());
  }

  function fadeSwap(el, mutateFn) {
    el.classList.add('is-swapping');
    window.setTimeout(function () {
      mutateFn();
      el.classList.remove('is-swapping');
    }, 160);
  }

  function setHeroMeta(cityKey, count) {
    var cityName = CITIES[cityKey].name;
    heroMeta.innerHTML = '<strong>' + count + '</strong> ' + cityName + ' localit' + (count === 1 ? 'y' : 'ies') + ' loaded from the model';
  }

  function resetPredictionState() {
    currentLoanPrincipal = null;
    resultCard.classList.add('is-hidden');
    emiValueEl.textContent = '\u2014';
  }

  /* ------------------------------------------------------------------
     Popular localities — a card per locality (tag + name + CTA),
     matched against the live dropdown only when the selected city has
     a live model and location list.
     ------------------------------------------------------------------ */

  function renderLocalities(city) {
    localitiesText.textContent = city.available
      ? "Tap an area to jump straight to the predictor with it pre-selected, if it's in the current dataset."
      : 'Get familiar with ' + city.name + '\u2019s popular neighbourhoods while the prediction model is on its way.';

    localitiesGrid.innerHTML = '';
    city.localities.forEach(function (locality) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'locality-card';

      var tag = document.createElement('span');
      tag.className = 'locality-tag';
      tag.textContent = locality.tag;

      var name = document.createElement('span');
      name.className = 'locality-name';
      name.textContent = locality.name;

      var desc = document.createElement('span');
      desc.className = 'locality-desc';
      desc.textContent = locality.desc;

      var cta = document.createElement('span');
      cta.className = 'locality-cta';
      cta.textContent = city.available ? 'Select this area \u2192' : 'Explore \u2192';

      card.appendChild(tag);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(cta);

      card.addEventListener('click', function () {
        if (city.available) {
          var match = findMatchingLocationOption(locality.name);
          if (match) locationSelect.value = match.value;
          document.getElementById('predictor').scrollIntoView({ behavior: 'smooth', block: 'start' });
          locationSelect.focus();
        } else {
          document.getElementById('predictor').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      localitiesGrid.appendChild(card);
    });
  }

  function findMatchingLocationOption(name) {
    var wanted = name.trim().toLowerCase();
    var options = Array.prototype.slice.call(locationSelect.options);
    var exact = options.find(function (opt) { return opt.text.trim().toLowerCase() === wanted; });
    if (exact) return exact;
    return options.find(function (opt) {
      var text = opt.text.trim().toLowerCase();
      return text.indexOf(wanted) !== -1 || wanted.indexOf(text) !== -1;
    }) || null;
  }

  /* ------------------------------------------------------------------
     Loading the selected city's locations for the dropdown
     NOTE ON URLS: bhk.html is served separately from Flask (e.g. via Live
     Server on http://127.0.0.1:5500) while Flask runs on :5000 — different
     origins, so API_BASE is hardcoded and server.py needs CORS enabled
     (flask-cors) for both GET and POST. If you later serve bhk.html FROM
     Flask itself, switch API_BASE back to '' so paths stay relative.
     ------------------------------------------------------------------ */

  function loadCityLocations(cityKey) {
    var city = CITIES[cityKey];
    if (!city || !city.available || !city.locationsEndpoint) {
      setLocationErrorState();
      return;
    }

    if (locationOptionsByCity[cityKey]) {
      populateLocationDropdown(cityKey, locationOptionsByCity[cityKey]);
      return;
    }

    setLocationLoadingState();

    fetch(API_BASE + city.locationsEndpoint + '?city=' + encodeURIComponent(cityKey))
      .then(function (response) {
        if (!response.ok) throw new Error('Server responded with status ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var locations = Array.isArray(data.location) ? data.location : [];
        if (locations.length === 0) throw new Error('No locations returned');
        locationOptionsByCity[cityKey] = locations;
        populateLocationDropdown(cityKey, locations);
      })
      .catch(function () {
        if (selectedCityKey !== cityKey) return;
        setLocationErrorState();
        showGlobalAlert('Unable to load locations. Please make sure the Flask server is running, then refresh the page.');
      });
  }

  function setLocationLoadingState() {
    locationSelect.disabled = true;
    locationSelect.innerHTML = '<option value="">Loading locations&hellip;</option>';
  }

  function setLocationErrorState() {
    locationSelect.disabled = true;
    locationSelect.innerHTML = '<option value="">Locations unavailable</option>';
  }

  function populateLocationDropdown(cityKey, locations) {
    var sorted = locations.slice().sort(function (a, b) { return String(a).localeCompare(String(b)); });

    locationCountsByCity[cityKey] = sorted.length;

    if (selectedCityKey !== cityKey) return;

    var optionsHtml = '<option value="">Select a location</option>';
    sorted.forEach(function (name) {
      optionsHtml += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    });

    locationSelect.innerHTML = optionsHtml;
    locationSelect.disabled = false;
    setHeroMeta(cityKey, sorted.length);
  }

  /* ------------------------------------------------------------------
     Form submit -> validate -> call the selected city's predict endpoint
     Absolute rule: only ever fires for a city that is `available` and has
     a real `endpoint` — enforced here even though the UI already hides
     the form for every other city, so this can never fire a request
     against one city's model on another city's behalf.
     ------------------------------------------------------------------ */

  function handlePredictSubmit(event) {
    event.preventDefault();

    var city = CITIES[selectedCityKey];
    if (!city || !city.available || !city.endpoint) return;

    clearAllFieldErrors();
    hideGlobalAlert();

    var formValues = {
      location: locationSelect.value,
      total_sqft: sqftInput.value,
      bhk: bhkSelect.value,
      bath: bathSelect.value
    };

    var validation = validateForm(formValues);
    if (!validation.valid) {
      applyFieldErrors(validation.errors);
      return;
    }

    var requestBody = {
      city: selectedCityKey,
      total_sqft: Number(formValues.total_sqft),
      location: formValues.location,
      bhk: Number(formValues.bhk),
      bath: Number(formValues.bath)
    };

    setLoadingState(true);

    fetch(API_BASE + city.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (data) {
          if (!response.ok) {
            var serverMessage = data && (data.error || data.message);
            throw new Error(serverMessage || 'The server could not calculate a price.');
          }
          return data;
        });
      })
      .then(function (data) {
        var price = getPriceFromResponse(data);
        if (price === null) throw new Error('Received an unexpected response from the prediction server.');
        if (price <= 0) throw new Error('The model couldn\u2019t produce a reliable estimate for this combination of details. Try adjusting the square footage, BHK, or location.');
        renderResult(price, requestBody);
      })
      .catch(function (error) {
        var isNetworkError = error instanceof TypeError;
        var message = isNetworkError
          ? 'Unable to connect to the prediction server. Please make sure the Flask server is running.'
          : (error.message || 'Something went wrong while estimating the price. Please try again.');
        showGlobalAlert(message);
      })
      .finally(function () {
        setLoadingState(false);
      });
  }

  /* ------------------------------------------------------------------
     Validation
     ------------------------------------------------------------------ */

  function validateForm(values) {
    var errors = {};
    if (!values.location) errors.locationError = 'Please select a location.';

    var sqft = Number(values.total_sqft);
    if (!values.total_sqft || isNaN(sqft) || sqft <= 0) errors.sqftError = 'Enter a valid area greater than 0.';

    if (!values.bhk) errors.bhkError = 'Please select the number of BHK.';
    if (!values.bath) errors.bathError = 'Please select the number of bathrooms.';

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function applyFieldErrors(errors) {
    Object.keys(errors).forEach(function (errorId) {
      var errorEl = document.getElementById(errorId);
      if (errorEl) errorEl.textContent = errors[errorId];
      var fieldId = errorId.replace('Error', '');
      var field = document.getElementById(fieldId === 'location' ? 'locationSelect'
        : fieldId === 'sqft' ? 'sqftInput'
        : fieldId === 'bhk' ? 'bhkSelect'
        : 'bathSelect');
      if (field) field.classList.add('has-error');
    });
  }

  function clearAllFieldErrors() {
    document.querySelectorAll('.form-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
  }

  /* ------------------------------------------------------------------
     Reading the predicted price out of the API response
     ------------------------------------------------------------------ */

  function getPriceFromResponse(data) {
    if (data === null || data === undefined) return null;
    if (typeof data === 'number') return data;

    var candidateKeys = ['estimated_price', 'predicted_price', 'price', 'prediction'];
    for (var i = 0; i < candidateKeys.length; i++) {
      var key = candidateKeys[i];
      if (typeof data[key] === 'number') return data[key];
      if (typeof data[key] === 'string' && data[key].trim() !== '' && !isNaN(Number(data[key]))) return Number(data[key]);
    }
    return null;
  }

  /* ------------------------------------------------------------------
     Formatting
     ------------------------------------------------------------------ */

  function toLakhs(rawPrice) {
    return rawPrice;
  }

  function formatPriceFromLakhs(priceInLakhs) {
    if (priceInLakhs >= 100) return '\u20B9 ' + (priceInLakhs / 100).toFixed(2) + ' Crore';
    return '\u20B9 ' + priceInLakhs.toFixed(2) + ' Lakhs';
  }

  function formatRupees(value) {
    return '\u20B9 ' + Math.round(value).toLocaleString('en-IN');
  }

  /* ------------------------------------------------------------------
     Rendering the result + property summary
     ------------------------------------------------------------------ */

  function renderResult(rawPrice, requestBody) {
    var priceInLakhs = toLakhs(rawPrice);
    var priceInRupees = priceInLakhs * 100000;

    resultPrice.textContent = formatPriceFromLakhs(priceInLakhs);
    pricePerSqftEl.textContent = formatRupees(priceInRupees / requestBody.total_sqft) + ' / sq.ft';

    summaryLocation.textContent = requestBody.location;
    summarySqft.textContent = requestBody.total_sqft + ' sq.ft';
    summaryBhk.textContent = requestBody.bhk + ' BHK';
    summaryBath.textContent = requestBody.bath + (requestBody.bath === 1 ? ' Bathroom' : ' Bathrooms');

    currentLoanPrincipal = priceInRupees;
    updateEmi();

    resultCard.classList.remove('is-hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ------------------------------------------------------------------
     EMI calculator
     ------------------------------------------------------------------ */

  function updateEmi() {
    if (currentLoanPrincipal === null) return;

    var annualRate = Number(emiRateInput.value);
    var years = Number(emiTenureSelect.value);
    if (!annualRate || !years || annualRate <= 0) {
      emiValueEl.textContent = '\u2014';
      return;
    }

    var monthlyRate = annualRate / 12 / 100;
    var months = years * 12;
    var factor = Math.pow(1 + monthlyRate, months);
    var emi = (currentLoanPrincipal * monthlyRate * factor) / (factor - 1);

    emiValueEl.textContent = formatRupees(emi) + ' / mo';
  }

  /* ------------------------------------------------------------------
     Loading / disabled button state
     ------------------------------------------------------------------ */

  function setLoadingState(isLoading) {
    predictBtn.disabled = isLoading;
    predictBtn.classList.toggle('is-loading', isLoading);
    predictBtn.querySelector('.btn-label').textContent = isLoading ? 'Calculating\u2026' : 'Estimate Price';
  }

  /* ------------------------------------------------------------------
     Global alert banner
     ------------------------------------------------------------------ */

  function showGlobalAlert(message) {
    globalAlert.textContent = message;
    globalAlert.classList.remove('is-hidden');
    globalAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideGlobalAlert() {
    globalAlert.classList.add('is-hidden');
    globalAlert.textContent = '';
  }

  /* ------------------------------------------------------------------
     Small helper: escape text before inserting into innerHTML
     ------------------------------------------------------------------ */

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

})();