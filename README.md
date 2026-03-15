# Wind Tunnel Simulation (React Three Fiber)

Interactive cycling draft simulation built with  React Three Fiber.

## Live DEMO: https://m0xoo.github.io/wind-tunnel-simulation/

![Screenshot](screenshot.png)

## What this app does

This app visualizes how airflow and drafting change when multiple bikes ride in line.
You can adjust wind speed, lead rider power, and bike-to-bike gaps, then inspect how those
inputs affect estimated aerodynamic savings for each rider.

## Core features

- Real-time 3D bike scene using React Three Fiber.
- Wind streamlines that bend around riders and show local flow speed by color.
- Surface pressure-style coloring on bike meshes (low to high resistance areas).
- Peloton editor:
  - Add/remove riders.
  - Adjust each following rider's gap from 50 to 800 cm.
- Per-rider metrics panel:
  - Estimated watts saved vs lead rider.
  - Estimated drag-reduction percentage.
- Adjustable environmental and effort inputs:
  - Wind speed (5-80 km/h).
  - Lead rider power (120-700 W).

## Calculation model (how numbers are computed)

### 1) Draft reduction from wheel gap

Each follower gets a base drag reduction from a piecewise empirical function of gap:

- <= 0.3 m: ~55% reduction
- 0.3-0.7 m: linearly transitions to ~45%
- 0.7-2.0 m: linearly transitions to ~27%
- 2.0-8.0 m: linearly transitions to ~10%
- > 8.0 m: ~10%

### 2) Extra shelter from more riders ahead

If a rider has more than one rider ahead, the app adds a small diminishing-return bonus:

- `+ 0.06 * (1 - exp(-(ridersAhead - 1) * 0.8))`
- Total reduction is capped at 66%.

### 3) Convert drag reduction to watts saved

The app estimates aerodynamic share of lead rider power as speed-dependent:

- `aeroShare = clamp(0.4 + 0.5 * ((speedKmh - 20) / 30), 0.4, 0.9)`
- `leadAeroPower = leadPowerWatts * aeroShare`
- `savedWatts = leadAeroPower * draftReduction`

So displayed savings represent estimated aerodynamic power saved relative to the lead rider.

### 4) Flow field for visualization

The streamline field combines:

- Uniform freestream in `-Z`.
- Potential-flow-like perturbations around ellipsoidal rider bodies.
- Extra wake turbulence behind riders.

This field drives particle motion and local speed coloring so users can visually see sheltered
zones behind each bike.

## Assumptions and scope

- This is an educational/interactive aerodynamic model, not full CFD.
- Riders are represented by idealized ellipsoids for fast real-time simulation.
- Draft percentages are empirical approximations tuned for practical intuition.

## Asset requirement

Place the bike model at:

- `public/meshy.glb`

Without this file, the app cannot render the bike model.

## Run locally

```bash
npm install
npm run dev
```