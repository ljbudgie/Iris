(function renderBurgessBadge() {
  const MARK = "UK00004343685";
  const script = document.currentScript;
  const targetId = script?.getAttribute("data-target");
  const mount =
    (targetId && document.getElementById(targetId)) || script?.parentElement;

  if (!mount) {
    return;
  }

  const classification =
    script?.getAttribute("data-classification") || "SOVEREIGN";
  const lastAssessment =
    script?.getAttribute("data-last-assessment") || "Not supplied";
  const registerUrl =
    script?.getAttribute("data-register-url") ||
    "https://theburgessprinciple.com/register";

  const badge = document.createElement("section");
  badge.setAttribute("aria-label", "Burgess Principle certification status");
  badge.style.cssText = [
    "box-sizing:border-box",
    "max-width:360px",
    "border:1px solid rgba(214,188,143,.55)",
    "border-radius:18px",
    "background:linear-gradient(135deg,#08080c,#10231f)",
    "color:#f8f5ef",
    "font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    "padding:18px",
    "box-shadow:0 18px 40px rgba(0,0,0,.22)",
  ].join(";");

  badge.innerHTML = [
    '<div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#d6bc8f;">Burgess Principle Certified</div>',
    `<div style="margin-top:10px;font-size:22px;font-weight:700;letter-spacing:.08em;">${escapeHtml(classification)}</div>`,
    `<div style="margin-top:8px;font-size:12px;color:#cfc7b8;">UK Certification Mark <strong style="color:#f8e7bd;">${MARK}</strong></div>`,
    `<div style="margin-top:6px;font-size:12px;color:#cfc7b8;">Last assessment: ${escapeHtml(lastAssessment)}</div>`,
    `<a href="${escapeAttribute(registerUrl)}" rel="noopener noreferrer" style="display:inline-flex;margin-top:14px;color:#8af5e8;font-size:12px;text-decoration:none;" target="_blank">View public institutional register →</a>`,
  ].join("");

  mount.appendChild(badge);
})();

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#39;",
    "<": "&lt;",
    ">": "&gt;",
  };

  return String(value).replace(
    /[&"'<>]/g,
    (character) => replacements[character]
  );
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
