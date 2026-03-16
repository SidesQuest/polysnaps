/*
  Event framework stub -- design only until backend (Supabase) is ready.

  Data model:
  - events table: { id, name, description, start_date, end_date, type, rules, rewards }
  - event_leaderboard: { event_id, user_id, score, tier_group, rank }
  - user_event_progress: { event_id, user_id, progress_data, last_updated }
  - friends: { user_id, friend_id, status }

  Event types:
  - "production_race"  -- most total production in event period
  - "prestige_sprint"  -- most prestiges in event period
  - "shape_challenge"  -- specific shape placement goals
  - "combo_hunt"       -- discover the most combos

  Tier grouping (prevents whale dominance):
  - Group players by total prestige level ranges: 0-3, 4-7, 8-12, 13+
  - Separate leaderboards per tier group
  - Rewards scale with tier group difficulty

  Reward structure:
  - Top 10%:  Exclusive cosmetic + 20 Cores
  - Top 25%:  Cosmetic variant + 10 Cores
  - Top 50%:  5 Cores
  - Participation: 2 Cores

  Seasonal schedule:
  - Monthly events, each lasting 7 days
  - 3-day break between events for results display
*/

export function getActiveEvent() {
  return null;
}

export function getEventLeaderboard() {
  return [];
}

export function submitEventScore() {
  console.log("[EVENT STUB] Score submission -- backend required");
  return false;
}

export function getEventRewards() {
  return null;
}

export function getFriendsLeaderboard() {
  return [];
}
