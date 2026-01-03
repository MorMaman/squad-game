# Squad Game - Project Status & Vision

## The Idea

**Squad Game** is a mobile-first daily gaming platform for private friend groups. Think "Wordle meets BeReal meets mini-games" - but exclusively within your close circle of friends.

### Core Hook
**One event opens daily at a random time** (between 8 AM - 10 PM) with only a **5-minute participation window**. This creates:
- Artificial urgency & FOMO-driven engagement
- Daily habit formation
- "Where were you when the event dropped?" social moments

### Why Squads (Not Global)?
- **Intimacy over scale** - Compete with people you actually know
- **Accountability** - Friends notice when you miss
- **Trust** - The Judge system works because you know each other
- **Lower stakes, higher fun** - No toxic global leaderboard culture

---

## Goals

### Primary Goals
1. **Daily Engagement** - Get users to open the app every single day
2. **Social Connection** - Strengthen real friendships through playful competition
3. **Habit Formation** - The random timing creates anticipation throughout the day
4. **Retention** - Streaks, XP, and squad accountability keep users coming back

### Success Metrics (Target)
| Metric | Target |
|--------|--------|
| DAU/MAU | >60% |
| 7-day retention | >50% |
| Event participation rate | >80% |
| Average streak length | >14 days |
| Squad size | 4-8 members |

---

## User Flow

### First-Time User Journey
```
Download App
     |
     v
Sign Up (Email/Password)
     |
     v
Onboarding
  - Enter display name
  - Choose avatar icon (8 themed options)
     |
     v
Squad Selection
  - Create new squad (become admin)
  - Join existing squad (via 6-char invite code)
  - Skip for now (explore solo)
     |
     v
Main App (Today tab)
  - See daily challenge countdown
  - Wait for event to open
```

### Daily Event Flow
```
Morning: Event scheduled (hidden time)
     |
     v
Random Time (8AM-10PM): Event Opens!
  - Push notification sent
  - 5-minute window starts
     |
     v
User Opens App
  - Sees "LIVE" badge pulsing
  - Countdown showing time remaining
  - "PLAY NOW" button
     |
     v
Completes Challenge
  - Live Selfie: Take photo + optional poll
  - Pressure Tap: Tap at exactly 0.00 seconds
  - Daily Poll: Answer trivia question
     |
     v
Submission Recorded
  - +25-35 XP earned
  - Points added to leaderboard
  - Streak maintained
     |
     v
Event Closes (5 min after open)
  - Judge finalizes rankings
  - Results revealed
  - 1-hour challenge window
     |
     v
Next Day: Repeat
```

### Judge System Flow
```
Event Closes
     |
     v
Random Squad Member = Today's Judge
     |
     v
Judge Reviews Submissions
  - Views all photos/scores
  - Confirms rankings
  - Finalizes outcome
     |
     v
Other Members Can Challenge (1 hour)
  - If >50% challenge → Outcome overturned
  - Judge loses 10 points if overturned
  - Judge gains 10 points if approved
```

---

## What's Done

### Authentication & Onboarding
- [x] Email/password sign up & login
- [x] Magic link (OTP) authentication
- [x] Profile creation with display name
- [x] Avatar icon selection (8 themed icons)
- [x] Squad creation with auto-generated invite code
- [x] Squad joining via invite code
- [x] Skip squad option (can join later)
- [x] Back navigation in onboarding flow
- [x] Case-insensitive unique squad names

### Core Gameplay
- [x] **Live Selfie** - Camera capture with countdown
- [x] **Pressure Tap** - Reflex game (tap at 0.00)
- [x] **Daily Poll** - Multiple choice questions
- [x] Event scheduling (random time 8AM-10PM)
- [x] 5-minute participation window
- [x] Real-time submission tracking
- [x] Leaderboard ranking calculation

### Gamification
- [x] XP system with level progression
- [x] 15+ level titles (Newbie → Mythic Legend)
- [x] XP progress bar with milestones
- [x] Streak tracking (current + personal best)
- [x] Animated streak badge with fire effects
- [x] Weekly points (reset every Monday)
- [x] Lifetime points accumulation

### Judge System
- [x] Random judge selection per event
- [x] Judge finalization interface
- [x] Challenge mechanism (1-hour window)
- [x] Auto-overturn if >50% challenge
- [x] Point rewards/penalties for judge

### UI/UX
- [x] Dark theme throughout
- [x] Smooth 60fps animations (Reanimated)
- [x] Haptic feedback on interactions
- [x] Confetti celebration effects
- [x] Floating XP animations
- [x] Level-up overlay
- [x] Pulsing "LIVE" indicators
- [x] Countdown timers with color urgency
- [x] Squad status banner

### Backend
- [x] Supabase database schema
- [x] Row-level security policies
- [x] Edge functions for event lifecycle
- [x] Push notification integration
- [x] Real-time subscriptions
- [x] Image storage for selfies

### Testing
- [x] Playwright E2E test suite
- [x] Squad creation/joining tests
- [x] Game mechanic tests
- [x] Screenshot capture for debugging

---

## What Needs To Be Done

### High Priority

#### 1. Badge System
```
Currently: Badges are mentioned but not implemented
Needed:
  - Participation badges (7-day, 30-day, 100-day)
  - Streak badges (7, 30, 100, 365 streaks)
  - Performance badges (1st place wins)
  - Social badges (invite friends)
  - Event-type badges (selfie master, tap champion)
  - Badge display on profile
  - Badge unlock notifications
```

#### 2. Statistics Page
```
Currently: Basic stats in profile
Needed:
  - Detailed stats dashboard
  - Event history with outcomes
  - Win/loss record per event type
  - Best/worst performance
  - Squad comparisons
  - Graphs and visualizations
```

#### 3. Event Archive/History
```
Currently: Only today's event visible
Needed:
  - Past events browser
  - Replay submissions (view old selfies)
  - Historical leaderboards
  - "On this day" memories
```

#### 4. Notification Improvements
```
Currently: Basic push when event opens
Needed:
  - "Event opening soon" reminder (5 min before)
  - "You haven't participated" warning (2 min left)
  - Daily recap notification
  - Streak at risk warning
  - Squad activity notifications
```

### Medium Priority

#### 5. Squad Management
```
- Remove members (admin only)
- Transfer admin role
- Squad settings (event times, frequency)
- Squad profile/description
- Squad creation date & stats
```

#### 6. Social Features
```
- In-app invite sharing
- Deep links for squad invites
- Reactions to submissions (emoji)
- Comments on selfies
- "Poke" absent members
```

#### 7. More Event Types
```
Ideas:
  - Word scramble
  - Drawing challenge
  - Voice memo
  - Location check-in
  - Trivia rounds
  - Photo scavenger hunt
```

#### 8. Timezone Support
```
Currently: All times in UTC
Needed:
  - Per-squad timezone setting
  - Event times relative to squad timezone
  - "Opens between 8AM-10PM YOUR time"
```

### Lower Priority

#### 9. Offline Support
```
- Queue submissions when offline
- Sync when connection restored
- Offline event viewing
```

#### 10. Performance Optimizations
```
- Image compression for selfies
- Lazy loading for large squads
- Caching improvements
- Bundle size reduction
```

#### 11. Monetization (Future)
```
Potential options:
  - Premium squad features
  - Custom avatars/themes
  - Extended event windows
  - Multiple daily events
  - Ad-free experience
```

---

## Suggestions & Ideas

### Quick Wins
1. **Streak Recovery** - Allow one "free pass" per month for missed days
2. **Practice Mode** - Let users try games without affecting stats
3. **Daily Recap** - Summary notification with who won, who missed
4. **Share Results** - Export leaderboard as image for social media

### Engagement Boosters
1. **Weekly Champion** - Crown the highest scorer each week
2. **Rivalry System** - Track head-to-head records between members
3. **Themed Events** - Holiday specials, seasonal challenges
4. **Squad Challenges** - Compete against other squads (opt-in)

### Retention Mechanics
1. **Comeback Bonus** - Extra XP for returning after absence
2. **Milestone Celebrations** - Big animations for 100 days, etc.
3. **Legacy Stats** - "Member since Day 1" badges
4. **Squad Anniversaries** - Celebrate squad creation dates

### UX Improvements
1. **Onboarding Tutorial** - Explain game types before first event
2. **Event Preview** - Show what type of event is coming (without time)
3. **Quick Actions** - Swipe to participate from notification
4. **Widget** - iOS/Android widget showing countdown

### Underdog Power System (Planned Feature)
Last place player unlocks ONE random Underdog Power for the next day (if they participated).

| Power | Effect | UI Indicator |
|-------|--------|--------------|
| **Double Chance** | Two attempts in next event, best result counts | "x2" badge next to name during event |
| **Target Lock** | Select one player as "target" (visible to all) | Crosshair icon + "Targeted" label (24h) |
| **Chaos Card** | Activate temporary rule modifier for next event | Banner before event showing active rule |
| **Streak Shield** | One-time streak protection if you miss | Shield icon next to streak counter |

**Implementation Notes:**
- Random power assigned when event finalizes
- Power stored in `user_powers` table with expiration
- UI shows "Underdog Active" badge (red/orange) with countdown
- Power auto-expires after 24 hours or when used
- Only awarded if last-place player actually participated (no reward for not showing up)

### Anti-Cheat Enhancements
1. **Photo Verification** - Detect old/fake photos
2. **Time Sync** - Ensure device time isn't manipulated
3. **Multiple Judges** - Require 2+ judges for disputes
4. **Reputation Score** - Track judge accuracy over time

---

## Technical Debt & Known Issues

### Current Issues
1. ~~Squad screen shows when user already has squad (fixed)~~
2. ~~Back button shows when no navigation history (fixed)~~
3. ~~Raw database errors shown to users (fixed)~~
4. Camera permissions need better error handling
5. Large selfie images could use compression

### Code Quality
1. Some components could use refactoring (large files)
2. Test coverage could be expanded
3. Error boundaries needed for crash recovery
4. Logging could be more structured

### Performance
1. Real-time subscriptions could be optimized
2. Image loading could use progressive loading
3. Animation performance on older devices

---

## Project Structure

```
squad-game/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth flow screens
│   ├── (tabs)/            # Main tab navigation
│   ├── events/            # Event gameplay screens
│   ├── games/             # Practice games
│   └── results/           # Event results
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── effects/       # Animation effects
│   │   └── game/          # Game-specific components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Supabase client
│   ├── services/          # Push notifications
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── supabase/
│   └── functions/         # Edge functions
├── tests/                 # Playwright E2E tests
└── assets/               # Images & fonts
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React Native + Expo 51 |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Backend | Supabase (Postgres + Auth + Storage) |
| Real-time | Supabase Subscriptions |
| Animations | React Native Reanimated |
| Testing | Playwright |
| Language | TypeScript |

---

## Next Steps (Recommended Priority)

1. **Implement Badge System** - Major engagement driver
2. **Add Statistics Page** - Users love seeing their progress
3. **Improve Notifications** - Critical for 5-min window participation
4. **Event History** - Let users relive memories
5. **More Event Types** - Variety keeps things fresh

---

*Last Updated: January 2026*
*Status: Active Development*
