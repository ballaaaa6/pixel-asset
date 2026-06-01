// Helper function for SHA-256 hashing
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "dime_app_salt_2026!");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const PORTFOLIOS = env.PORTFOLIOS;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if user exists
    let userJson = await PORTFOLIOS.get(`user:${cleanUsername}`);

    // Pre-configured Admin Auto-Generation:
    // If admin doesn't exist yet, we create it dynamically.
    if (!userJson && cleanUsername === "admin") {
      const adminHash = await hashPassword("123456");
      const adminId = crypto.randomUUID();
      const adminUser = {
        username: "admin",
        passwordHash: adminHash,
        id: adminId
      };
      // Save admin to database
      await PORTFOLIOS.put("user:admin", JSON.stringify(adminUser));
      await PORTFOLIOS.put(`portfolio:${adminId}`, JSON.stringify([]));
      userJson = JSON.stringify(adminUser);
    }

    if (!userJson) {
      return new Response(
        JSON.stringify({ error: "ไม่พบชื่อผู้ใช้นี้ในระบบ" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const user = JSON.parse(userJson);

    // Verify password hash
    const inputHash = await hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return new Response(
        JSON.stringify({ error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Login successful - return a session token (we use the random UUID as a secure token)
    return new Response(
      JSON.stringify({
        message: "เข้าสู่ระบบสำเร็จ!",
        token: user.id,
        username: user.username,
        userId: user.id
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: " + err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
