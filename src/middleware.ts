import { NextRequest, NextResponse } from "next/server";

const PASSWORD = "fortune";
const COOKIE_NAME = "zk-auth";

export function middleware(req: NextRequest) {
  const authed = req.cookies.get(COOKIE_NAME)?.value === "1";
  if (authed) return NextResponse.next();

  // Handle password submission
  if (req.method === "POST" && req.nextUrl.pathname === "/") {
    return new NextResponse(null, { status: 307, headers: { Location: "/" } });
  }

  // Check query param for password submission via GET redirect
  const pw = req.nextUrl.searchParams.get("pw");
  if (pw === PASSWORD) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("pw");
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE_NAME, "1", { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  // Show password page
  return new NextResponse(passwordPage(), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

function passwordPage() {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zkeleton Data Vision</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0f; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { text-align: center; max-width: 360px; width: 100%; padding: 48px 32px; }
  .title { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #2dd4aa; margin-bottom: 32px; font-weight: 500; }
  form { display: flex; flex-direction: column; gap: 12px; }
  input { background: #12121a; border: 1px solid #1e1e2e; border-radius: 6px; padding: 12px 16px; color: #e0e0e0; font-size: 14px; text-align: center; outline: none; letter-spacing: 0.1em; }
  input:focus { border-color: #2dd4aa40; }
  input::placeholder { color: #333; }
  button { background: #2dd4aa10; border: 1px solid #2dd4aa30; border-radius: 6px; padding: 10px; color: #2dd4aa; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; font-weight: 500; }
  button:hover { background: #2dd4aa20; }
  .err { color: #ef4444; font-size: 11px; margin-top: 4px; display: none; }
</style>
</head><body>
<div class="card">
  <div class="title">Zkeleton Data Vision</div>
  <form id="f" onsubmit="go(event)">
    <input id="pw" type="password" placeholder="Enter password" autofocus autocomplete="off">
    <button type="submit">Enter</button>
    <div class="err" id="err">Incorrect password</div>
  </form>
</div>
<script>
function go(e) {
  e.preventDefault();
  var v = document.getElementById('pw').value;
  window.location.href = '/?pw=' + encodeURIComponent(v);
}
</script>
</body></html>`;
}
