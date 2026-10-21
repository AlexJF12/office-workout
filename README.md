# Office Workout

A mobile-friendly web app with 20 swipeable cards of stretches and moves that physical therapists and trainers
recommend for people who sit at a desk all day.

- **Swipe right** (or tap ✓) when you've done a move, **swipe left** (or ✕) to skip. Arrow keys work on desktop.
- Each session shuffles all 20 cards. Undo is there if you swipe by mistake.
- Every card has an **animated figure** demonstrating the move, with the working muscles highlighted.
- Timed moves (holds, per-side stretches, held reps) have a **built-in timer** that chimes and vibrates at each
  "switch sides" / "relax" / "done".
- Your sessions, a day streak and totals are saved **on your device** (localStorage). No account, no server.
- Installable to your home screen and works offline (PWA).

## The 20 exercises

| Area       | Exercise                                                                           |
| ---------- | ---------------------------------------------------------------------------------- |
| Neck       | Chin Tucks · Ear-to-Shoulder Stretch · Head Turns                                  |
| Shoulders  | Shoulder Rolls · Doorway Chest Stretch · Cross-Body Shoulder Stretch · Desk Push-Ups |
| Upper back | Shoulder Blade Squeeze · Wall Angels · Chair Back Extension                        |
| Back       | Seated Spinal Twist · Standing Side Bend · Standing Back Extension                 |
| Wrists     | Wrist & Forearm Stretch                                                            |
| Hips       | Standing Hip Flexor Stretch · Seated Figure-4 Stretch                              |
| Legs       | Chair Squats · Standing Quad Stretch · Seated Hamstring Stretch · Calf Raises      |

Picked from the moves that come up again and again in desk-worker guidance from Mayo Clinic, Hinge Health's
physical therapists, UC Davis, PT clinics and trainers. Each card links its sources. This is general fitness
guidance, not medical advice.

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (session logic, timer phases, every animation solves cleanly)
npm run build    # production build into dist/
```

- `src/data/exercises.ts`: the 20 exercises: text, dose, sources and animation keyframes.
- `src/figure/`: a tiny 2D skeleton rig (joint angles + two-bone IK) and the SVG renderer.
  Open `/dev/preview.html` in the dev server to see every exercise at several points of its loop while tuning poses
  (add `?id=chin-tucks` for one).
- `src/components/`: swipe card, timer, and the home / deck / summary / history screens.

## Deploying

`.github/workflows/deploy.yml` tests, builds and deploys to GitHub Pages on every push to `main`.
One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
