const SHEETS_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyD2nysGjyt92thQY6ORrqTm1qtaeWPiaFpiJIHICqFhH-pqL01Aein4MH0LJPzVSZQVA/exec";
const WEB3FORMS_KEY = "d38558e6-c576-4688-b65d-367953ec1fc9";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_NAME_RE = /^(student|test|name|asdf|anonymous)$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname === "/finlit-submit") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method === "POST" && url.pathname.replace(/\/$/, "") === "/finlit-submit") {
      return handleFinlit(request);
    }
    const asset = await env.ASSETS.fetch(request);
    if (url.pathname === "/test.html" || url.pathname.endsWith("/test.html")) {
      const next = new Response(asset.body, asset);
      next.headers.set("Cache-Control", "no-store, max-age=0");
      return next;
    }
    return asset;
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}

function isPlaceholderName(name) {
  return PLACEHOLDER_NAME_RE.test(String(name || "").trim());
}

function coerce(data) {
  const next = data && typeof data === "object" ? data : {};
  let name = String(next.name || next.Name || "").trim();
  let email = String(next.email || next.Email || "").trim();
  if (isPlaceholderName(name)) name = "";
  if (EMAIL_RE.test(name) && !EMAIL_RE.test(email)) {
    const swapped = email;
    email = name;
    name = swapped;
  }
  if (!EMAIL_RE.test(email)) email = "";
  next.name = name;
  next.Name = name;
  next.email = email;
  next.Email = email;
  if (Array.isArray(next.cells) && next.cells.length >= 3) {
    next.cells[1] = name;
    next.cells[2] = email;
    if (next.board) next.cells[5] = next.board;
  }
  return next;
}

function sheetPayload(data) {
  const out = {
    submitted_at: data.submitted_at,
    name: data.name,
    email: data.email,
    grade: data.grade,
    school: data.school,
    board: data.board,
    Board: data.board,
    bg_transport: data.bg_transport || data.transport || "",
    transport: data.bg_transport || data.transport || "",
    bg_parents: data.bg_parents || "",
    bg_area: data.bg_area || "",
    bg_devices: data.bg_devices || "",
    bg_income: data.bg_income || "",
    time_used: data.time_used,
    time_used_min: data.time_used_min,
    auto_submitted: data.auto_submitted,
    score: data.score,
    score_total: data.score,
    part_a: data.part_a,
    part_b: data.part_b,
    part_c: data.part_c,
    part_d: data.part_d,
    wrong_questions: data.wrong_questions,
    cells: data.cells
  };
  for (let i = 1; i <= 27; i++) {
    out["q" + i] = data["q" + i] || "";
    out["q" + i + "_choice"] = data["q" + i + "_choice"] || data["q" + i] || "";
  }
  return out;
}

async function handleFinlit(request) {
  let data;
  try {
    data = await request.json();
  } catch (err) {
    return json(400, { ok: false, error: "Invalid JSON" });
  }
  data = coerce(data);
  if (!data.name || isPlaceholderName(data.name)) {
    return json(400, { ok: false, error: "A real name is required." });
  }
  if (!EMAIL_RE.test(data.email)) {
    return json(400, { ok: false, error: "A real email address is required." });
  }

  const clean = sheetPayload(data);
  const sheetBody = JSON.stringify(clean);
  const sheet = fetch(SHEETS_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: sheetBody,
    redirect: "follow"
  }).catch(function () { return null; });

  const mail = fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: "FinLit attempt: " + data.name + " — " + (data.score || data.score_total || "") + " / 25",
      from_name: "FinLit Index",
      name: data.name,
      email: data.email,
      message:
        "Name: " + data.name +
        "\nEmail: " + data.email +
        "\nGrade: " + (data.grade || "") +
        "\nBoard: " + (data.board || "") +
        "\nSchool: " + (data.school || "") +
        "\nScore: " + (data.score || "") +
        "\n\n" + sheetBody
    })
  }).catch(function () { return null; });

  const results = await Promise.all([sheet, mail]);
  const mailed = !!(results[1] && results[1].ok);
  return json(200, { ok: true, mailed: mailed });
}
