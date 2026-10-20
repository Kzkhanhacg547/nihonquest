import type { Config } from "@netlify/functions";

export default async () => {
  const siteUrl = process.env.URL || process.env.NEXTAUTH_URL || "https://nihonquest.netlify.app";
  const cronSecret = process.env.CRON_SECRET || "";

  console.log(`[NETLIFY SCHEDULED CRON] Running automated study reminder check at ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${siteUrl}/api/cron/study-reminders?secret=${cronSecret}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log("[NETLIFY SCHEDULED CRON] Result:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[NETLIFY SCHEDULED CRON ERROR]:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};

// Scheduled daily at 01:00 UTC (which is 08:00 AM UTC+7 Vietnam time)
export const config: Config = {
  schedule: "0 1 * * *",
};
