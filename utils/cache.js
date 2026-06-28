export function jsonHeaders(maxAgeSeconds = 300) {
  return {
    "cache-control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`,
    "content-type": "application/json; charset=utf-8",
  };
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      ...jsonHeaders(init.maxAgeSeconds),
      ...(init.headers || {}),
    },
  });
}

export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, { status, maxAgeSeconds: 0 });
}
