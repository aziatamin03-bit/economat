var server_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  server_default as default
};
