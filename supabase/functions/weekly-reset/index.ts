// Reset weekly points every Monday at midnight
// This function should be called by a cron job at Monday 00:00 UTC

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
      if (!authHeader?.includes(supabaseServiceKey)) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Reset weekly points
    const { error: resetError } = await supabase.rpc("reset_weekly_points");

    if (resetError) {
      throw resetError;
    }

    // Decay old strikes (reduce by 1)
    const { error: decayError } = await supabase.rpc("decay_old_strikes");

    if (decayError) {
      throw decayError;
    }

    return new Response(
      JSON.stringify({
        message: "Weekly reset completed",
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in weekly-reset:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
