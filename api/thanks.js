import { jsonResponse } from "../utils/cache.js";

export async function POST(request, env) {
  try {
    const data = await request.json();
    console.log("Thanks feedback received:", data);
    return jsonResponse({ success: true, message: "Thank you for supporting Pit Wall!" });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 400 });
  }
}
