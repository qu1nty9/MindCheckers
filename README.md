# MindCheckers

MindCheckers is a calm Duolingo-style web prototype for training strategic thinking through 8x8 checkers.

It is not positioned as another online checkers board. The product idea is a lightweight strategy gym: play a short match, receive coach feedback, and track improvement in tactical awareness, foresight, and endgame discipline.

## Demo Features

- 8x8 playable checkers board
- Legal diagonal movement, captures, mandatory captures, multi-jump continuations, and king promotion
- Local AI opponent with three difficulty moods: Gentle, Focused, and Sharp
- Highlighted legal moves and coach hints
- Post-game coach review with strategy score, mistake pattern, and next drill
- 60-second demo onboarding path for judges and first-time users
- Move history panel for showing that the game is being analyzed
- Dark/light theme toggle saved locally
- Supabase-ready email magic-link auth with local fallback
- Pass-and-play friend mode plus Supabase Realtime room links with Host/Guest sides when configured
- Progress stored in `localStorage`: XP, streak, tactics, foresight, and endgame skill bars
- Optional cloud profile, cloud review archive, and global city leaderboard through Supabase
- Level system with named strategy ranks, XP-to-next-level progress, and unlock messaging
- Stored game review archive in `localStorage` with move-by-move replay
- Training path cards that make the learning progression visible
- Interactive daily missions with claimable XP rewards
- Copyable demo summary for pitching or sharing progress
- Product layer preview: Pro modal, league joining, level drills, city leaderboard, board skins, and upgrade path
- Mobile-first responsive interface

## Product Positioning

We are not building another checkers website.

We are building a strategic thinking trainer powered by checkers gameplay and AI-style feedback.

The market gap is that most checkers products focus on basic play, simple ads, or old multiplayer hubs. MindCheckers borrows the retention loop of Duolingo and the learning loop of Chess.com, but keeps the experience calm and focused.

## Requirement Coverage

The prototype intentionally targets the "Great" path from the brief while staying realistic for a short deadline.

- Core game: 8x8 board, legal movement, mandatory captures, multi-jumps, kings, and winner detection.
- Strong product layer: local AI opponent, three difficulty levels, hints, move history, responsive layout, auth-ready profile, and saved progress.
- Great-level differentiation: AI-style coach review, unique niche around strategic thinking, level system, daily missions, replayable game archive, Supabase Realtime room links, city league preview, Pro board skins, and Upgrade to Pro flow.
- Delivery requirements: live GitHub Pages project, GitHub repository, and product README explaining what was built, for whom, and why it is valuable.

## Business Logic

MindCheckers is built around a retention loop rather than a one-off game:

1. Play a short training match.
2. Receive a review with strategy score, skill breakdown, mistakes, and next drill.
3. Earn XP, progress through named strategy levels, and complete missions.
4. Return for daily streaks, league ranking, and Pro-style deeper analysis.

The monetization path is visible in the prototype through the Pro preview: deeper reviews, unlimited level drills, seasonal leagues, and unlockable cosmetic board themes.

## Target User

People who want to train strategic thinking with short, low-friction games.

The first audience is not only competitive checkers players. It is users who want a simple daily mental workout with visible improvement.

## Technical Notes

This prototype runs as a static site by default and upgrades into a Supabase-backed service when `config.js` is filled.

Open `index.html` in a browser to run the app.

The local AI is heuristic-based. The coach is rule-based and analyzes move history for captures, exposed pieces, promotion, material, tempo, safety, and endgame conversion. This keeps the demo stable within a short deadline while still showing the intended product loop.

To enable the real backend path:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Put the project URL and anon key into `config.js`.
4. Enable email magic links in Supabase Auth settings.

With Supabase configured, MindCheckers uses email auth, cloud profile sync, cloud review storage/loading, global city leaderboard rows, and Realtime WebSocket room broadcasts for friend links. Room creators play Green, invitees open `role=coral` links and play Coral.

## Roadmap

- Stronger AI engine with deeper search
- Personalized drills generated from recurring mistakes
- Stripe checkout for paid Pro skins
- Seasonal league resets and anti-cheat checks
- Optional LLM-powered coach explanations
- Pro tier with advanced reviews and unlimited drills
