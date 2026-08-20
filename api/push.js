import { jsonResponse } from "../utils/cache.js";

export async function POST(request, env) {
  try {
    const data = await request.json();
    console.log("Push subscription received:", data);
    return jsonResponse({ success: true, message: "Successfully subscribed to push notifications!" });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 400 });
  }
}
