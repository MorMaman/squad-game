// Open events that are scheduled and past their opens_at time
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
  profile: {
    expo_push_token: string | null;
    display_name: string;
  };
}

async function sendPushNotifications(event: Event): Promise<void> {
  // Get all squad members with push tokens
  const { data: members, error } = await supabase
    .from("squad_members")
    .select(`
      user_id,
      profile:profiles (
        expo_push_token,
        display_name
      )
    `)
    .eq("squad_id", event.squad_id);

  if (error || !members) {
    console.error("Error fetching members:", error);
    return;
  }

  const pushTokens = (members as unknown as SquadMember[])
    .map((m) => m.profile?.expo_push_token)
    .filter((token): token is string => !!token);

  if (pushTokens.length === 0) {
    console.log("No push tokens for squad", event.squad_id);
    return;
  }

  const eventNames: Record<string, string> = {
    LIVE_SELFIE: "Live Selfie",
    PRESSURE_TAP: "Pressure Tap",
    POLL: "Daily Poll",
  };

  // Send push notifications via Expo
  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title: "Event is LIVE!",
    body: `${eventNames[event.event_type] || "Daily Event"} is now open. You have 5 minutes!`,
    data: {
      screen: "/(tabs)",
      eventId: event.id,
    },
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log(`Sent ${pushTokens.length} notifications for event ${event.id}`, result);
  } catch (error) {
    console.error("Error sending push notifications:", error);
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

    // Find all scheduled events that should be opened
    const { data: events, error: fetchError } = await supabase
      .from("daily_events")
      .select("id, squad_id, event_type")
      .eq("status", "scheduled")
      .lte("opens_at", now);

    if (fetchError) {
      throw fetchError;
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events to open", timestamp: now }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Update events to open status
    const eventIds = events.map((e) => e.id);
    const { error: updateError } = await supabase
      .from("daily_events")
      .update({ status: "open" })
      .in("id", eventIds);

    if (updateError) {
      throw updateError;
    }

    // Send push notifications for each event
    await Promise.all(
      (events as Event[]).map((event) => sendPushNotifications(event))
    );

    return new Response(
      JSON.stringify({
        message: `Opened ${events.length} events`,
        eventIds,
        timestamp: now,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in open-events:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
