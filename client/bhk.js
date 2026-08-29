/* ==========================================================================
   Home Price Predictor — bhk.js
   Multi-city platform shell around the existing, unmodified Bengaluru
   prediction pipeline (Flask server.py -> util.py -> pickle model).

   ARCHITECTURE
   ------------
   CITIES is the single source of truth for every city's content. Only
   Bengaluru currently has `available: true` and real endpoint paths — every
   other city has `available: false` and `endpoint: null`. selectCity()
   re-renders the page from this object; nothing city-specific is hardcoded
   in bhk.html beyond element ids to populate.

   To activate a new city later (e.g. once a Mumbai model exists), the only
   change needed here is flipping that city's `available` to true and
   filling in its `endpoint`/`locationsEndpoint` — no HTML/CSS changes.
   ========================================================================== */

(function () {
  'use strict';

  var API_BASE = 'http://127.0.0.1:5000'; // Flask's port. See the note in loadBengaluruLocations().

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
      available: false,
      endpoint: null,
      locationsEndpoint: null,
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
     Landmark illustrations — minimalist line-art, one per city.
     Each is just the inner <g> content; heroVisualShell() wraps it with
     a shared glow + ground line so every city feels like one design
     system rather than 13 different ones.
     ------------------------------------------------------------------ */

  var LANDMARKS = {
    // Vidhana Soudha — domed legislature with a colonnaded base
    bengaluru:
      '<rect x="110" y="235" width="220" height="65"/>' +
      '<line x1="125" y1="235" x2="125" y2="300"/><line x1="150" y1="235" x2="150" y2="300"/>' +
      '<line x1="175" y1="235" x2="175" y2="300"/><line x1="200" y1="235" x2="200" y2="300"/>' +
      '<line x1="240" y1="235" x2="240" y2="300"/><line x1="265" y1="235" x2="265" y2="300"/>' +
      '<line x1="290" y1="235" x2="290" y2="300"/><line x1="315" y1="235" x2="315" y2="300"/>' +
      '<rect x="193" y="196" width="54" height="39"/>' +
      '<path d="M193 196 A27 27 0 0 1 247 196"/>' +
      '<line x1="220" y1="169" x2="220" y2="150"/><circle cx="220" cy="146" r="4"/>' +
      '<path d="M150 235 A16 16 0 0 1 182 235" transform="translate(-30,0)"/>' +
      '<path d="M258 235 A16 16 0 0 1 290 235" transform="translate(30,0)"/>' +
      '<line x1="95" y1="300" x2="345" y2="300"/><line x1="85" y1="310" x2="355" y2="310"/>',

    // Charminar — four minarets around a grand central arch
    mumbai:
      // Gateway of India — central arch with corner turret domes, near water
      '<rect x="180" y="150" width="80" height="150"/>' +
      '<path d="M180 220 A40 40 0 0 1 260 220" fill="none"/>' +
      '<circle cx="180" cy="150" r="9"/><line x1="180" y1="141" x2="180" y2="126"/>' +
      '<circle cx="260" cy="150" r="9"/><line x1="260" y1="141" x2="260" y2="126"/>' +
      '<rect x="150" y="300" width="140" height="14"/>' +
      '<path d="M60 312 Q100 302 140 312 T220 312 T300 312 T380 312"/>' +
      '<path d="M60 322 Q100 314 140 322 T220 322 T300 322 T380 322"/>',

    delhi:
      // India Gate — a solitary arch on a stepped plinth
      '<path d="M180 300 V180 A40 40 0 0 1 260 180 V300"/>' +
      '<line x1="180" y1="235" x2="260" y2="235"/>' +
      '<rect x="160" y="300" width="120" height="10"/>' +
      '<rect x="150" y="310" width="140" height="10"/>',

    hyderabad:
      '<rect x="100" y="220" width="24" height="80"/><path d="M100 220 A12 12 0 0 1 124 220"/><line x1="112" y1="208" x2="112" y2="198"/>' +
      '<rect x="316" y="220" width="24" height="80"/><path d="M316 220 A12 12 0 0 1 340 220"/><line x1="328" y1="208" x2="328" y2="198"/>' +
      '<rect x="168" y="150" width="20" height="150"/><path d="M168 150 A10 10 0 0 1 188 150"/><line x1="178" y1="140" x2="178" y2="130"/>' +
      '<rect x="252" y="150" width="20" height="150"/><path d="M252 150 A10 10 0 0 1 272 150"/><line x1="262" y1="140" x2="262" y2="130"/>' +
      '<path d="M188 300 V220 A32 32 0 0 1 252 220 V300"/>' +
      '<path d="M205 260 A15 15 0 0 1 235 260"/>',

    chennai:
      // Gopuram — a stepped temple tower
      '<path d="M175 300 L265 300 L258 275 L182 275 Z"/>' +
      '<path d="M182 275 L258 275 L251 252 L189 252 Z"/>' +
      '<path d="M189 252 L251 252 L245 231 L195 231 Z"/>' +
      '<path d="M195 231 L245 231 L239 212 L201 212 Z"/>' +
      '<path d="M201 212 L239 212 L233 195 L207 195 Z"/>' +
      '<path d="M212 195 L228 195 L220 178 Z"/>' +
      '<circle cx="220" cy="170" r="5"/>',

    kolkata:
      // Howrah Bridge — cantilever truss between two pylons
      '<rect x="90" y="150" width="18" height="150"/>' +
      '<rect x="332" y="150" width="18" height="150"/>' +
      '<path d="M108 160 L160 200 L212 160 L264 200 L332 160"/>' +
      '<path d="M108 190 L160 160 L212 190 L264 160 L332 190"/>' +
      '<line x1="90" y1="230" x2="350" y2="230"/>' +
      '<path d="M50 300 Q100 292 150 300 T250 300 T350 300 T390 300"/>',

    pune:
      // Shaniwar Wada — fortified gate with bastion towers
      '<rect x="110" y="210" width="55" height="90"/>' +
      '<rect x="275" y="210" width="55" height="90"/>' +
      '<path d="M110 210 h10 v-8 h10 v8 h10 v-8 h10 v8 h15" />' +
      '<path d="M275 210 h10 v-8 h10 v8 h10 v-8 h10 v8 h15" />' +
      '<path d="M175 300 V190 A45 45 0 0 1 265 190 V300"/>' +
      '<line x1="195" y1="230" x2="195" y2="290"/><line x1="220" y1="230" x2="220" y2="290"/><line x1="245" y1="230" x2="245" y2="290"/>' +
      '<line x1="185" y1="245" x2="255" y2="245"/><line x1="185" y1="265" x2="255" y2="265"/>',

    ahmedabad:
      // Sidi Saiyyed jali — an arch containing a branching "tree of life" lattice
      '<path d="M150 300 V160 A70 70 0 0 1 290 160 V300"/>' +
      '<line x1="220" y1="300" x2="220" y2="200"/>' +
      '<path d="M220 260 L190 230 M220 260 L250 230 M220 230 L198 205 M220 230 L242 205 M220 200 L205 180 M220 200 L235 180"/>' +
      '<path d="M220 245 L200 260 M220 245 L240 260 M220 215 L203 225 M220 215 L237 225"/>',

    jaipur:
      // Hawa Mahal — honeycomb grid of small jharokha windows
      '<rect x="120" y="140" width="200" height="160"/>' +
      '<path d="M120 140 Q140 125 160 140 T200 140 T240 140 T280 140 T320 140"/>' +
      (function () {
        var rows = [165, 195, 225, 255];
        var cols = [145, 180, 215, 250, 285];
        var out = '';
        rows.forEach(function (y) {
          cols.forEach(function (x) {
            out += '<path d="M' + (x - 8) + ' ' + (y + 10) + ' V' + y + ' A8 8 0 0 1 ' + (x + 8) + ' ' + y + ' V' + (y + 10) + '"/>';
          });
        });
        return out;
      })(),

    lucknow:
      // Rumi Darwaza — a tall scalloped Awadhi gateway
      '<path d="M170 300 V210 Q170 160 195 160 Q205 140 220 160 Q235 140 245 160 Q270 160 270 210 V300"/>' +
      '<path d="M195 300 V230 A25 25 0 0 1 245 230 V300"/>' +
      '<line x1="150" y1="220" x2="150" y2="300"/><circle cx="150" cy="212" r="7"/>' +
      '<line x1="290" y1="220" x2="290" y2="300"/><circle cx="290" cy="212" r="7"/>',

    chandigarh:
      // Open Hand Monument on a pivot, with a faint sector-grid backdrop
      '<g stroke-opacity="0.35"><line x1="80" y1="140" x2="80" y2="300"/><line x1="150" y1="120" x2="150" y2="300"/><line x1="290" y1="120" x2="290" y2="300"/><line x1="360" y1="140" x2="360" y2="300"/>' +
      '<line x1="70" y1="180" x2="370" y2="180"/><line x1="70" y1="250" x2="370" y2="250"/></g>' +
      '<line x1="220" y1="300" x2="220" y2="210"/>' +
      '<path d="M220 210 C205 210 195 195 198 175 C199 165 210 160 213 172 C213 158 226 155 228 170 C230 156 243 158 241 173 C248 165 258 172 250 185 C260 182 262 195 250 200 C240 205 228 210 220 210 Z"/>',

    kochi:
      // Chinese fishing nets — cantilevered frame over the water
      '<line x1="140" y1="300" x2="200" y2="150"/>' +
      '<line x1="200" y1="150" x2="320" y2="170"/>' +
      '<line x1="140" y1="230" x2="230" y2="255"/>' +
      '<line x1="140" y1="265" x2="240" y2="280"/>' +
      '<path d="M200 150 L320 170 L245 265 L200 210 Z"/>' +
      '<line x1="230" y1="255" x2="180" y2="290"/><circle cx="180" cy="296" r="5"/>' +
      '<path d="M40 300 Q90 292 140 300 T240 300 T340 300 T400 300"/>',

    vizag:
      // Coastline — Kailasagiri hill, a lighthouse, and the sea
      '<path d="M60 300 Q140 220 230 300"/>' +
      '<path d="M300 250 v-70 M292 180 h16 M296 165 h8"/><rect x="294" y="182" width="12" height="68"/>' +
      '<circle cx="300" cy="175" r="4"/>' +
      '<path d="M30 300 Q80 290 130 300 T230 300 T330 300 T400 300"/>' +
      '<path d="M30 312 Q80 304 130 312 T230 312 T330 312 T400 312"/>'
  };

  function heroVisualShell(innerSvg) {
    return '<svg viewBox="0 0 440 360" width="100%" height="100%" class="landmark-svg">' +
      '<defs><radialGradient id="heroGlow" cx="50%" cy="34%" r="55%">' +
      '<stop offset="0%" stop-color="#C6963C" stop-opacity="0.16"/>' +
      '<stop offset="100%" stop-color="#C6963C" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect x="0" y="0" width="440" height="360" fill="url(#heroGlow)"/>' +
      '<g class="landmark-illustration" stroke="#DBAE5C" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
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
  var bengaluruLocationCount = null;    // set once /get_location_names resolves

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupMobileNav();
    setupCitySelector();
    form.addEventListener('submit', handlePredictSubmit);
    emiRateInput.addEventListener('input', updateEmi);
    emiTenureSelect.addEventListener('change', updateEmi);

    loadBengaluruLocations(); // fetched once up front regardless of which city is initially shown

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

      if (key === 'bengaluru' && bengaluruLocationCount !== null) {
        setHeroMeta(bengaluruLocationCount);
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

    if (city.available) {
      predictorLive.classList.remove('is-hidden');
      predictorComingSoon.classList.add('is-hidden');
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

  function setHeroMeta(count) {
    heroMeta.innerHTML = '<strong>' + count + '</strong> Bengaluru localit' + (count === 1 ? 'y' : 'ies') + ' loaded from the model';
  }

  /* ------------------------------------------------------------------
     Popular localities — a card per locality (tag + name + CTA),
     matched against the live dropdown only when the selected city has
     one (i.e. Bengaluru).
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
     Loading Bengaluru's locations for the dropdown
     NOTE ON URLS: bhk.html is served separately from Flask (e.g. via Live
     Server on http://127.0.0.1:5500) while Flask runs on :5000 — different
     origins, so API_BASE is hardcoded and server.py needs CORS enabled
     (flask-cors) for both GET and POST. If you later serve bhk.html FROM
     Flask itself, switch API_BASE back to '' so paths stay relative.
     ------------------------------------------------------------------ */

  function loadBengaluruLocations() {
    setLocationLoadingState();

    fetch(API_BASE + CITIES.bengaluru.locationsEndpoint)
      .then(function (response) {
        if (!response.ok) throw new Error('Server responded with status ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var locations = Array.isArray(data.location) ? data.location : [];
        if (locations.length === 0) throw new Error('No locations returned');
        populateLocationDropdown(locations);
      })
      .catch(function () {
        setLocationErrorState();
        if (selectedCityKey === 'bengaluru') {
          showGlobalAlert('Unable to load locations. Please make sure the Flask server is running, then refresh the page.');
        }
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

  function populateLocationDropdown(locations) {
    var sorted = locations.slice().sort(function (a, b) { return String(a).localeCompare(String(b)); });

    var optionsHtml = '<option value="">Select a location</option>';
    sorted.forEach(function (name) {
      optionsHtml += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    });

    locationSelect.innerHTML = optionsHtml;
    locationSelect.disabled = false;

    bengaluruLocationCount = sorted.length;
    if (selectedCityKey === 'bengaluru') setHeroMeta(bengaluruLocationCount);
  }

  /* ------------------------------------------------------------------
     Form submit -> validate -> call the selected city's predict endpoint
     Absolute rule: only ever fires for a city that is `available` and has
     a real `endpoint` — enforced here even though the UI already hides
     the form for every other city, so this can never fire a request
     against the Bengaluru model on another city's behalf.
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
    return rawPrice > 10000 ? rawPrice / 100000 : rawPrice;
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