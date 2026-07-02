const form = document.getElementById('appraisal-form');
const generateBtn = document.getElementById('generate-btn');

const reportEmpty = document.getElementById('report-empty');
const reportLoading = document.getElementById('report-loading');
const reportOutput = document.getElementById('report-output');

const adminSection = document.getElementById('admin-section');
const adminInstruction = document.getElementById('adminInstruction');
const regenerateBtn = document.getElementById('regenerate-btn');
const revisionTag = document.getElementById('revision-tag');

// In-memory only — this is a frontend demo, nothing is persisted.
let state = {
  payload: null,
  reportText: null,
  revision: 1,
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    address: document.getElementById('address').value.trim(),
    propertyType: document.getElementById('propertyType').value,
    landSize: document.getElementById('landSize').value,
    bedrooms: document.getElementById('bedrooms').value,
    bathrooms: document.getElementById('bathrooms').value,
    condition: document.getElementById('condition').value,
    comparables: document.getElementById('comparables').value.trim(),
    notes: document.getElementById('notes').value.trim(),
  };

  setLoading(true, generateBtn);

  try {
    const res = await fetch('/.netlify/functions/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const data = await res.json();

    state = { payload, reportText: data.report, revision: 1 };

    renderReport(data.report, payload, 1);
    adminSection.hidden = false;
    adminInstruction.value = '';
    revisionTag.textContent = '';
  } catch (err) {
    console.error(err);
    renderError();
  } finally {
    setLoading(false, generateBtn);
  }
});

regenerateBtn.addEventListener('click', async () => {
  const instruction = adminInstruction.value.trim();

  if (!instruction) {
    revisionTag.textContent = 'Type an instruction before regenerating.';
    return;
  }

  setLoading(true, regenerateBtn);

  try {
    const res = await fetch('/.netlify/functions/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...state.payload,
        previousReport: state.reportText,
        adminInstruction: instruction,
      }),
    });

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const data = await res.json();
    const nextRevision = state.revision + 1;

    state = { ...state, reportText: data.report, revision: nextRevision };

    renderReport(data.report, state.payload, nextRevision);
    adminInstruction.value = '';
    revisionTag.textContent = 'Report updated successfully ✓';
  } catch (err) {
    console.error(err);
    revisionTag.textContent = "Couldn't regenerate the report — try again.";
  } finally {
    setLoading(false, regenerateBtn);
  }
});

function setLoading(isLoading, triggerBtn) {
  triggerBtn.disabled = isLoading;
  if (triggerBtn === generateBtn) {
    reportLoading.hidden = !isLoading;
    if (isLoading) {
      reportEmpty.hidden = true;
      reportOutput.hidden = true;
      adminSection.hidden = true;
    }
  }
}

function renderReport(reportText, payload, revision) {
  reportEmpty.hidden = true;
  reportOutput.hidden = false;

  const html = reportText
    .split(/\n(?=[A-Z][A-Za-z &]+:)/)
    .map(block => {
      const [, heading, body] = block.match(/^([A-Za-z &]+):\s*([\s\S]*)$/) || [null, null, block];
      if (heading) {
        return `<h3>${escapeHtml(heading.trim())}</h3><p>${escapeHtml(body.trim()).replace(/\n/g, '<br>')}</p>`;
      }
      return `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  reportOutput.innerHTML = `
    <p class="revision-label">Revision ${revision}</p>
    <h3>Property</h3>
    <p>${escapeHtml(payload.address || 'Address not provided')}</p>
    ${html}
  `;
}

function renderError() {
  reportEmpty.hidden = true;
  reportOutput.hidden = false;
  reportOutput.innerHTML = `
    <h3>Something went wrong</h3>
    <p>The appraisal couldn't be generated. Check that the Netlify function and API key are configured, then try again.</p>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
