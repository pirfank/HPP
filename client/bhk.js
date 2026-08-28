/* ==========================================================================
   Bengaluru Home Price Predictor — bhk.js
   Talks to the Flask backend in ../server. Two endpoints are used:
     GET  /get_location_names   -> { location: [ ... ] }
     POST /predict_home_price   -> a JSON object containing the predicted price

   NOTE ON URLS: client/ and server/ are separate folders here — bhk.html is
   opened directly or via a static server like VS Code's Live Server
   (typically http://127.0.0.1:5500), while Flask runs on its own port
   (http://127.0.0.1:5000, per server.py). Those are two different origins,
   so relative paths like fetch('/get_location_names') would be sent to the
   Live Server origin instead of Flask and fail. API_BASE is hardcoded below
   to point straight at Flask.

   This means server.py needs CORS enabled for the browser to allow it, e.g.:
     from flask_cors import CORS
     CORS(app)
   (pip install flask-cors if it isn't already in your .venv). If Flask is
   already logging successful requests without that, it's already handled.

   If you later serve bhk.html FROM Flask itself (e.g. via a templates/
   folder and render_template), switch API_BASE back to '' so paths stay
   relative and this stops mattering.
   ========================================================================== */

(function () {
  'use strict';

  var API_BASE = 'http://127.0.0.1:5000'; // Flask's port, per your server.py
  var LOCATIONS_ENDPOINT = API_BASE + '/get_location_names';
  var PREDICT_ENDPOINT = API_BASE + '/predict_home_price';

  // ---- DOM references ----
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  var globalAlert = document.getElementById('globalAlert');

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
  var heroMeta = document.getElementById('heroMeta');

  var emiRateInput = document.getElementById('emiRate');
  var emiTenureSelect = document.getElementById('emiTenure');
  var emiValueEl = document.getElementById('emiValue');

  // Holds the last predicted price in rupees, so the EMI panel can
  // recompute live as the person tweaks rate/tenure without re-calling the API.
  var currentLoanPrincipal = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupMobileNav();
    loadLocations();
    form.addEventListener('submit', handlePredictSubmit);
    emiRateInput.addEventListener('input', updateEmi);
    emiTenureSelect.addEventListener('change', updateEmi);
    setupLocalityCards();
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */

  function setupMobileNav() {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close the mobile menu after a nav link is tapped
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------
     Loading locations for the dropdown
     ------------------------------------------------------------------ */

  function loadLocations() {
    setLocationLoadingState();

    fetch(LOCATIONS_ENDPOINT)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Server responded with status ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        var locations = Array.isArray(data.location) ? data.location : [];
        if (locations.length === 0) {
          throw new Error('No locations returned');
        }
        populateLocationDropdown(locations);
      })
      .catch(function () {
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

  function populateLocationDropdown(locations) {
    var sorted = locations.slice().sort(function (a, b) {
      return String(a).localeCompare(String(b));
    });

    var optionsHtml = '<option value="">Select a location</option>';
    sorted.forEach(function (name) {
      optionsHtml += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    });

    locationSelect.innerHTML = optionsHtml;
    locationSelect.disabled = false;

    var count = sorted.length;
    heroMeta.innerHTML = '<strong>' + count + '</strong> Bengaluru localit' + (count === 1 ? 'y' : 'ies') + ' loaded from the model';
  }

  /* ------------------------------------------------------------------
     Popular Localities — clicking a card pre-selects it and scrolls to
     the predictor, if that locality exists in the loaded dataset.
     ------------------------------------------------------------------ */

  function setupLocalityCards() {
    var cards = document.querySelectorAll('.locality-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var wanted = card.getAttribute('data-location') || '';
        var match = findMatchingLocationOption(wanted);
        if (match) {
          locationSelect.value = match.value;
        }
        document.getElementById('predictor').scrollIntoView({ behavior: 'smooth', block: 'start' });
        locationSelect.focus();
      });
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
     Form submit -> validate -> call /predict_home_price
     ------------------------------------------------------------------ */

  function handlePredictSubmit(event) {
    event.preventDefault();
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

    var formData = new FormData();

    formData.append('total_sqft', requestBody.total_sqft);
    formData.append('location', requestBody.location);
    formData.append('bhk', requestBody.bhk);
    formData.append('bath', requestBody.bath);

    fetch(PREDICT_ENDPOINT, {
      method: 'POST',
      body: formData
    })
      .then(function (response) {
        return response.json().catch(function () {
          return null; // response wasn't valid JSON
        }).then(function (data) {
          if (!response.ok) {
            var serverMessage = data && (data.error || data.message);
            throw new Error(serverMessage || 'The server could not calculate a price.');
          }
          return data;
        });
      })
      .then(function (data) {
        var price = getPriceFromResponse(data);
        if (price === null) {
          throw new Error('Received an unexpected response from the prediction server.');
        }
        renderResult(price, requestBody);
      })
      .catch(function (error) {
        // Never expose raw errors (e.g. network/TypeError) — show a friendly message.
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

    if (!values.location) {
      errors.locationError = 'Please select a location.';
    }

    var sqft = Number(values.total_sqft);
    if (!values.total_sqft || isNaN(sqft) || sqft <= 0) {
      errors.sqftError = 'Enter a valid area greater than 0.';
    }

    if (!values.bhk) {
      errors.bhkError = 'Please select the number of BHK.';
    }

    if (!values.bath) {
      errors.bathError = 'Please select the number of bathrooms.';
    }

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function applyFieldErrors(errors) {
    Object.keys(errors).forEach(function (errorId) {
      var errorEl = document.getElementById(errorId);
      if (errorEl) {
        errorEl.textContent = errors[errorId];
      }
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

    // A bare number, e.g. 85.5
    if (typeof data === 'number') return data;

    // Common key names — adjust/extend this list to match your Flask response.
    var candidateKeys = ['estimated_price', 'predicted_price', 'price', 'prediction'];
    for (var i = 0; i < candidateKeys.length; i++) {
      var key = candidateKeys[i];
      if (typeof data[key] === 'number') {
        return data[key];
      }
      if (typeof data[key] === 'string' && data[key].trim() !== '' && !isNaN(Number(data[key]))) {
        return Number(data[key]);
      }
    }

    return null;
  }

  /* ------------------------------------------------------------------
     Formatting the price for display
     ------------------------------------------------------------------ */

  function toLakhs(rawPrice) {
    // ASSUMPTION: the classic Bengaluru house-price model returns price in
    // Lakhs (e.g. 85.5 means ₹85.5 Lakhs). If your Flask response instead
    // returns plain rupees (e.g. 8550000), this heuristic converts it down
    // to Lakhs automatically. Adjust the threshold/division below if your
    // backend uses a different unit.
    return rawPrice > 10000 ? rawPrice / 100000 : rawPrice;
  }

  function formatPriceFromLakhs(priceInLakhs) {
    if (priceInLakhs >= 100) {
      var crores = priceInLakhs / 100;
      return '\u20B9 ' + crores.toFixed(2) + ' Crore';
    }
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
     EMI calculator — recomputed live from the last predicted price
     whenever the rate or tenure inputs change.
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
     Global alert banner (locations failed to load, prediction failed, etc.)
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