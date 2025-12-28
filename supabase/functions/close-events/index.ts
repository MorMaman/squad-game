// Close events that are open and past their closes_at time
// This function should be called every minute by a cron job

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Event {
  id: string;
  squad_id: string;
  event_type: string;
}

interface SquadMember {
  user_id: string;
}

async function calculateRanksForEvent(eventId: string): Promise<void> {
  await supabase.rpc("calculate_pressure_tap_ranks", { p_event_id: eventId });
}

async function applyMissedPenalties(event: Event): Promise<void> {
  // Get all squad members
  const { data: members, error: membersError } = await supabase
    .from("squad_members")
    .select("user_id")
    .eq("squad_id", event.squad_id);

  if (membersError || !members) {
    console.error("Error fetching members:", membersError);
    return;
  }

  // Get all users who submitted
  const { data: submissions, error: submissionsError } = await supabase
    .from("event_submissions")
    .select("user_id")
    .eq("event_id", event.id);

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError);
    return;
  }

  const submittedUserIds = new Set(submissions?.map((s) => s.user_id) || []);
  const missedUserIds = (members as SquadMember[])
    .filter((m) => !submittedUserIds.has(m.user_id))
    .map((m) => m.user_id);

  // Apply penalties for missed users
  for (const userId of missedUserIds) {
    await supabase.rpc("apply_missed_event_penalty", {
      p_user_id: userId,
      p_squad_id: event.squad_id,
    });
    console.log(`Applied missed penalty to user ${userId} for event ${event.id}`);
  }
}

async function awardPointsForSubmissions(event: Event): Promise<void> {
  // Get all submissions
  const { data: submissions, error } = await supabase
    .from("event_submissions")
    .select("user_id, rank, score")
    .eq("event_id", event.id)
    .order("rank", { ascending: true, nullsFirst: false });

  if (error || !submissions) {
    console.error("Error fetching submissions for points:", error);
    return;
  }

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i];
    let points = 10; // Base participation points

    // Additional points based on event type
    if (event.event_type === "PRESSURE_TAP" && sub.rank) {
      if (sub.rank === 1) points += 10; // Total 20
      else if (sub.rank === 2) points += 5; // Total 15
      // Rank 3+ gets base 10
    }

    await supabase.rpc("update_user_stats_on_submission", {
      p_user_id: sub.user_id,
      p_squad_id: event.squad_id,
      p_points: points,
    });
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
      if (!authHeader?.includes(supabaseServiceKey)) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const now = new Date().toISOString();

    // Find all open events that should be closed
    const { data: events, error: fetchError } = await supabase
      .from("daily_events")
      .select("id, squad_id, event_type")
      .eq("status", "open")
      .lte("closes_at", now);

    if (fetchError) {
      throw fetchError;
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events to close", timestamp: now }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Process each event
    for (const event of events as Event[]) {
      // Calculate ranks for PRESSURE_TAP events
      if (event.event_type === "PRESSURE_TAP") {
        await calculateRanksForEvent(event.id);
      }

      // Award points for all submissions
      await awardPointsForSubmissions(event);

      // Apply missed penalties
      await applyMissedPenalties(event);
    }

    // Update events to closed status
    const eventIds = events.map((e) => e.id);
    const { error: updateError } = await supabase
      .from("daily_events")
      .update({ status: "closed" })
      .in("id", eventIds);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: `Closed ${events.length} events`,
        eventIds,
        timestamp: now,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in close-events:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
