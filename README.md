# MindCheckers

MindCheckers is a calm Duolingo-style web prototype for training strategic thinking through 8x8 checkers.

It is not positioned as another online checkers board. The product idea is a lightweight strategy gym: play a short match, receive coach feedback, and track improvement in tactical awareness, foresight, and endgame discipline.

## Demo Features

- 8x8 playable checkers board
- Legal diagonal movement, captures, mandatory captures, multi-jump continuations, and king promotion
- Local AI opponent with three difficulty moods: Gentle, Focused, and Sharp
- Highlighted legal moves and coach hints
- Post-game coach review with strategy score, mistake pattern, and next drill
- Progress stored in `localStorage`: XP, streak, tactics, foresight, and endgame skill bars
- Level system with named strategy ranks, XP-to-next-level progress, and unlock messaging
- Interactive daily missions with claimable XP rewards
- Product layer preview: Pro modal, league joining, level drills, and leaderboard
- Mobile-first responsive interface

## Product Positioning

We are not building another checkers website.

We are building a strategic thinking trainer powered by checkers gameplay and AI-style feedback.

The market gap is that most checkers products focus on basic play, simple ads, or old multiplayer hubs. MindCheckers borrows the retention loop of Duolingo and the learning loop of Chess.com, but keeps the experience calm and focused.

## Target User

People who want to train strategic thinking with short, low-friction games.

The first audience is not only competitive checkers players. It is users who want a simple daily mental workout with visible improvement.

## Technical Notes

This prototype is intentionally static: no backend, no install step, no external API key.

Open `index.html` in a browser to run the app.

The local AI is heuristic-based. The coach is rule-based and analyzes move history for captures, exposed pieces, promotion, material, and safety. This keeps the demo stable within a short deadline while still showing the intended product loop.

## Roadmap

- Real account system and cloud game history
- Stronger AI engine with deeper search
- Personalized drills generated from recurring mistakes
- Multiplayer rooms via invite link
- Seasonal leagues and city leaderboards
- Optional LLM-powered coach explanations
- Pro tier with advanced reviews, custom boards, and unlimited drills
