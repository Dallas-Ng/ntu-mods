/** A JSON response; extra headers may add to or override Content-Type. */
export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  })
