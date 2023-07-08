# 4x44 A Javascript Strategy Game

## Synopsis
Just me having some fun an hour here or there every day. The goal one day is to have a short sub-1 hour game in the 4x vein, with the idea of having "44 turns" as a sort of rubric to base everything off of. I'm thinking of something of quite a small scale, the creation of a village/town and a band of heroes / warriors that see it grow to dominate the isle.

For now it's just a fancy island generator.


### TODO List
 - Start a basic game loop - a little dude that you can order to move, cycle turns, try and collect as many gems as you can before 44 turns are up
 - Add region landmass counter, spawn minerals / resources according to above-sea landmass & region (so iron-rich region/s, copper-rich region/s, gold-silver-tin present regions)

### Commits
<!-- `git log --date=format:'%Y-%m-%d' --pretty=format:'%ad %s'` -->

- 2023-07-01 tweaked temp and wet wind drift, updated README. Wind drift needs to ignore everything above sea level, as does basic temp calc
- 2023-07-01 added basic temp and wet wind drift
- 2023-06-28 fixed minor errors with rivers, also made them cut into the ground less often, produces smoother results
- 2023-06-28 added README
- 2023-06-28 seeded random number utils class working, had to hack static intilialisation though
- 2023-06-27 minor tweaking
- 2023-06-27 river gen v2, in own class plus rearranged gen sequence, tile types set more logically
- 2023-06-26 freshwater sealevel lakes
- 2023-06-24 first pass at rivers, theyre too short and lakey
- 2023-06-24 converted everything to modules for extensibility
- 2023-06-23 various
- 2023-06-22 stuck on regenning
- 2023-06-22 working and working
- 2023-06-20 added continents generator as regions generator, working on ridges n troughs
- 2023-06-20 don't need to leave p5, used buffer to save fps, also converted to island gen
- 2023-06-20 changed rendering to drastically increase FPS but at the cost of really annoying tearing
- 2023-06-19 started to work on extracting the game from p5 to see if that helps performance
- 2023-06-18 did something not sure what
- 2023-06-18 added various screen modes
- 2023-06-18 initial commit with basic worldgen
