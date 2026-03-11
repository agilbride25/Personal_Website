document.addEventListener("DOMContentLoaded", function () {
  // simple map values (visited countries)
  const mapValues = {
    ES: { visited: 1 },
    US: { visited: 1 },
    IT: { visited: 1 },
    DK: { visited: 1 },
    GB: { visited: 1 },
    JM: { visited: 1 },
    KR: { visited: 1 },
    MX: { visited: 1 },
    AR: { visited: 1 },
    IE: { visited: 1 }
  };

  new svgMap({
    targetElementID: "svgMap",
    data: {
      data: {
        visited: { name: "Visited", format: "{0}" }
      },
      applyData: "visited",
      values: mapValues
    },
    colorMin: "#9ca3af",
    colorMax: "#3b82f6"
  });

  const visitedSet = new Set(Object.keys(mapValues));

  // ----- 5) Click handling on the svg paths (delegated) -----
  const svgContainer = document.getElementById("svgMap");
  if (!svgContainer) return;

  // Custom 'mousclick' event listener: consumers can listen for 'mousclick' and
  // set e.detail.result = true/false. We provide a default handler that returns
  // true when the country is in the visitedSet.
  svgContainer.addEventListener('mousclick', function (e) {
    try {
      const country = e?.detail?.country ? String(e.detail.country).toUpperCase() : null;
      const isVisited = !!(country && visitedSet.has(country));
      if (e.detail) e.detail.result = isVisited;
      return isVisited; // handler returns true when visited
    } catch (err) {
      if (e.detail) e.detail.result = false;
      return false;
    }
  });

  function getCountryCodeFromElement(el, svgEl) {
    while (el && el !== svgEl && el !== document.body) {
      if (el.dataset) {
        if (el.dataset.code) return el.dataset.code;
        if (el.dataset.id) return el.dataset.id;
        if (el.dataset.iso) return el.dataset.iso;
        if (el.dataset.country) return el.dataset.country;
      }
      const dataId = el.getAttribute && el.getAttribute("data-id");
      if (dataId) return dataId;

      if (el.id && /^[A-Z]{2}$/.test(el.id)) return el.id;

      el = el.parentElement;
    }
    return null;
  }

  function attachOnce() {
    const svgEl = svgContainer.querySelector("svg");
    if (!svgEl) {
      setTimeout(attachOnce, 50);
      return;
    }

    svgEl.addEventListener("click", function (ev) {
      const code = getCountryCodeFromElement(ev.target, svgEl);
      if (!code) return;

      const norm = String(code).toUpperCase();

      // Dispatch the custom 'mousclick' event. The listener above will set
      // e.detail.result = true if the country is visited. Consumers may
      // override this behaviour by adding their own mousclick listeners.
      const mous = new CustomEvent('mousclick', { detail: { country: norm } });
      svgContainer.dispatchEvent(mous);
      const mousResult = mous.detail && mous.detail.result === true;

      // If the event did not mark the country as visited, fall back to visitedSet
      if (!mousResult && !visitedSet.has(norm)) return;

      // If popups.json hasn’t loaded yet, you’ll still get fallback later,
      // but countryInfo might be empty on the very first click.
      // We’ll render what we have and open anyway.
      if (!countryInfo[norm]) {
        // ensure at least fallback is available for this one
        const fallback = generateFallbackInfo();
        countryInfo[norm] = fallback[norm] || { title: norm, where: norm, when: "—", description: "" };
      }

      // Dispatch a 'countryclicked' event with the normalized code and
      // existing countryInfo (consumers may use this). We previously created
      // overlays/drawers here; UI is now created by Adventures.html.
      const countryClicked = new CustomEvent('countryclicked', { detail: { country: norm, info: countryInfo[norm] } });
      svgContainer.dispatchEvent(countryClicked);
    });
  }

  attachOnce();
});

