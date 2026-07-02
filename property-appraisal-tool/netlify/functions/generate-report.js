// netlify/functions/generate-report.js
//
// Receives property details from the frontend and asks Claude to draft
// (or, if an admin instruction is included, revise) a structured
// appraisal. This is a frontend demo — nothing is persisted server-side.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const {
    address, propertyType, landSize, bedrooms,
    bathrooms, condition, comparables, notes,
    previousReport, adminInstruction,
  } = payload;

  if (!address || !propertyType || !landSize) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const isRevision = Boolean(previousReport && adminInstruction);

  const prompt = isRevision
    ? buildRevisionPrompt({ address, propertyType, landSize, bedrooms, bathrooms, condition, comparables, notes, previousReport, adminInstruction })
    : buildInitialPrompt({ address, propertyType, landSize, bedrooms, bathrooms, condition, comparables, notes });

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error('Claude API error:', errText);
      return { statusCode: 502, body: 'AI generation failed' };
    }

    const claudeData = await claudeRes.json();
    const reportText = claudeData.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report: reportText }),
    };
  } catch (err) {
    console.error('Unhandled error:', err);
    return { statusCode: 500, body: 'Unexpected server error' };
  }
};

function buildInitialPrompt({ address, propertyType, landSize, bedrooms, bathrooms, condition, comparables, notes }) {
  return `You are an experienced property appraiser. Draft a structured appraisal
report for the property below. Use clear section headers exactly in this format
("Heading:" on its own line followed by the content), and keep each section concise.

Do NOT use any markdown formatting. No # headings, no **, no *, no --- lines. Plain text only.

Sections to include, in this order:
Summary: a 2-3 sentence overview of the property and its market position.
Key Features: short paragraph covering type, size, bed/bath count, and condition.
Comparable Sales: comment on the comparables provided, or note that none were supplied.
Valuation Approach: briefly explain the reasoning used to arrive at the estimate.
Estimated Value: a single AUD figure as a range, e.g. "$650,000 - $690,000", with one sentence of justification.

Property details:
- Address: ${address}
- Type: ${propertyType}
- Land size: ${landSize} m²
- Bedrooms: ${bedrooms || 'not specified'}
- Bathrooms: ${bathrooms || 'not specified'}
- Condition: ${condition}
- Comparable sales: ${comparables || 'none provided'}
- Additional notes: ${notes || 'none'}

This is a demo application — clearly an illustrative estimate, not a certified valuation.`;
}

function buildRevisionPrompt({ address, propertyType, landSize, bedrooms, bathrooms, condition, comparables, notes, previousReport, adminInstruction }) {
  return `You are an experienced property appraiser. An admin reviewing your previous
report has given you an instruction to revise it. Keep the same section structure and
headers as the original report ("Heading:" on its own line followed by the content),
Do NOT use any markdown formatting. No # headings, no **, no *, no --- lines. Plain text only.

Apply the admin's instruction precisely — if they specify a value, use it; if they
ask for a sentence to be added, add it in the most relevant section.

Sections to include, in this order:
Summary: a 2-3 sentence overview of the property and its market position.
Key Features: short paragraph covering type, size, bed/bath count, and condition.
Comparable Sales: comment on the comparables provided, or note that none were supplied.
Valuation Approach: briefly explain the reasoning used to arrive at the estimate.
Estimated Value: a single AUD figure as a range, with one sentence of justification.

Original property details:
- Address: ${address}
- Type: ${propertyType}
- Land size: ${landSize} m²
- Bedrooms: ${bedrooms || 'not specified'}
- Bathrooms: ${bathrooms || 'not specified'}
- Condition: ${condition}
- Comparable sales: ${comparables || 'none provided'}
- Additional notes: ${notes || 'none'}

Previously generated report:
"""
${previousReport}
"""

Admin instruction for this revision:
"${adminInstruction}"

This is a demo application — clearly an illustrative estimate, not a certified valuation.`;
}
