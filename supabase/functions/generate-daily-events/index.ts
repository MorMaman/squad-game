// Generate daily events for all squads
// This function should be called by a cron job at midnight (or early morning)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EVENT_TYPES = ["LIVE_SELFIE", "PRESSURE_TAP", "POLL"] as const;
const EVENT_DURATION_MINUTES = 5;

interface Squad {
  id: string;
  timezone: string;
}

interface PollQuestion {
  question: string;
  options: string[];
}

async function getRandomPoll(): Promise<PollQuestion | null> {
  const { data, error } = await supabase
    .from("poll_bank")
    .select("question, options")
    .eq("active", true)
    .order("random()")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as PollQuestion;
}

async function getJudgeForSquad(squadId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("select_judge_for_squad", {
    p_squad_id: squadId,
  });
  return error ? null : data;
}

function getRandomEventTime(timezone: string): Date {
  // Random time between 08:00 and 22:00 in the squad's timezone
  const now = new Date();
  const today = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  today.setHours(0, 0, 0, 0);

  // Random hour between 8 and 21 (so event + 5 min window ends before 22:05)
  const hour = 8 + Math.floor(Math.random() * 14);
  const minute = Math.floor(Math.random() * 60);

  today.setHours(hour, minute, 0, 0);

  // Convert back to UTC
  const utcTime = new Date(today.toLocaleString("en-US", { timeZone: "UTC" }));
  return utcTime;
}

async function generateEventForSquad(squad: Squad): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Check if event already exists for today
  const { data: existing } = await supabase
    .from("daily_events")
    .select("id")
    .eq("squad_id", squad.id)
    .eq("date", today)
    .single();

  if (existing) {
    console.log(`Event already exists for squad ${squad.id} on ${today}`);
    return;
  }

  // Select random event type
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];

  // Get random open time
  const opensAt = getRandomEventTime(squad.timezone);
  const closesAt = new Date(opensAt.getTime() + EVENT_DURATION_MINUTES * 60 * 1000);

  // Get judge for the day
  const judgeId = await getJudgeForSquad(squad.id);

  // Get poll question if event type is POLL
  let pollQuestion: string | null = null;
  let pollOptions: string[] | null = null;

  if (eventType === "POLL") {
    const poll = await getRandomPoll();
    if (poll) {
      pollQuestion = poll.question;
      pollOptions = poll.options;
    }
  }

  // Create the event
  const { error } = await supabase.from("daily_events").insert({
    squad_id: squad.id,
    date: today,
    event_type: eventType,
    opens_at: opensAt.toISOString(),
    closes_at: closesAt.toISOString(),
    judge_id: judgeId,
    status: "scheduled",
    poll_question: pollQuestion,
    poll_options: pollOptions,
  });

  if (error) {
    console.error(`Error creating event for squad ${squad.id}:`, error);
  } else {
    console.log(`Created ${eventType} event for squad ${squad.id} at ${opensAt.toISOString()}`);
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
      // Also allow service role key for manual triggers
      if (!authHeader?.includes(supabaseServiceKey)) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Get all squads
    const { data: squads, error } = await supabase
      .from("squads")
      .select("id, timezone");

    if (error) {
      throw error;
    }

    // Generate events for each squad
    const results = await Promise.allSettled(
      (squads as Squad[]).map((squad) => generateEventForSquad(squad))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        message: `Generated events for ${successful} squads, ${failed} failed`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-daily-events:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
