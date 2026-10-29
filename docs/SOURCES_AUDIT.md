# Audit of the Model A blueprint (2026-10-22), performed 2026-10-29

## Equations and numbers

All equations in blueprint sections 3–5 were re-derived; all baseline numbers were reproduced independently (JS solver, Python model, closed-form script). No numerical errors were found. Clarifications:

- "Washburn coefficient" here means D in L² = D t (m²/s). Some texts define the coefficient of √t instead; the site states the definition.
- The radius scaling depends on what is held constant (t ∝ 1/r with pure capillary drive, ∝ 1/r² at fixed independent Δp). Both are shown and tested.
- Mode B needs a pore length L_p (absent from the blueprint's input table); added, default 70 µm.
- Mode B has an exact implicit solution (not mentioned in the blueprint); now used for verification.
- Mode B can fill a non-wetting pore (θ > 90°) when p_L + p_c > p_g0, i.e. after evacuation; the blueprint's "θ > 90° … no filling" rule applies to Mode A without applied pressure.

## Sources

| Blueprint citation | Finding | Used? |
|---|---|---|
| Weydanz et al., J. Power Sources 380 (2018) | Confirmed: 126–134, DOI 10.1016/j.jpowsour.2018.01.081. Abstract: isotropic edge-inward wetting, vacuum ≈ 2× faster | Yes |
| TUM / FRM II press release | Confirmed (20 Mar 2018): just over 50 min vacuum vs ~100 min normal; ~10 % less electrolyte at normal pressure; four sides | Yes — numbers attributed to the press release |
| Davoodabadi et al., J. Power Sources 424 (2019) | Confirmed: 193–203, DOI 10.1016/j.jpowsour.2019.03.115; trends as stated | Yes, qualitative only |
| "Int. J. Mol. Sci. 16 (2015), KIT" electrolyte properties | Identified as Hofmann, Kaufmann, Müller & Hanemann, IJMS 16, 20258–20276, DOI 10.3390/ijms160920258. σ = 29.4 mN/m at 25 °C, μ = 4.4 mPa·s at **20 °C**, ρ = 1.3030 g/cm³ at 25 °C. Also reports separator contact angles 46.2° and 15.2° | Yes |
| Separator contact angle 65.4° (Nano-Micro Letters 2021) | Confirmed for "the separator" of that study (not named as Celgard); DOI 10.1007/s40820-021-00731-2 | Yes, as an example of spread |
| USPTO 9,083,034 (26.3° / 8.3°) | Not opened | **No** |
| Fries & Dreyer (ZARM page; JCIS 320, 327, 338) | Titles/volumes/pages confirmed from the ZARM page; DOIs not recorded | Yes (bibliographic) |
| Ramakrishnan, Wu, Zhang & Wasan, J. Fluid Mech. (2019) | Confirmed: vol. 872, 5–38, DOI 10.1017/jfm.2019.328 | Yes |
| KRÜSS wetting material | Not opened | **No** |

Added: Sheng et al. 2014 (Front. Energy Res. 2:56, DOI 10.3389/fenrg.2014.00056) for pore size; Washburn 1921 and Lucas 1918 (DOIs from index pages); Dormand & Prince 1980 (DOI from index page).

## Design references

animejs.com and motion.dev were not reachable from the build environment; their documentation (Timer methods; inView/animate) was consulted through search results and the installed packages' type definitions. bklit.com could not be opened either, so no technique from it was used — say so if asked; consider reviewing it yourself and noting what you take from it.
