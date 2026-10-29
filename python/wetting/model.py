"""
Electrolyte wetting — independent Python reference implementation.

This file is deliberately separate from the JavaScript solver that powers the
website (src/physics/). It is written from the same equations but uses a
DIFFERENT numerical method (classical RK4 with step-doubling error control
instead of Dormand–Prince 5(4)), so agreement between the two is meaningful.

It uses only the Python standard library, so it runs unchanged in:
  * desktop Python (pytest suite in python/tests/), and
  * the browser through Pyodide (Python compiled to WebAssembly) on the
    "Code & Verification" page.

All quantities are SI: m, Pa, Pa·s, N/m, s. Angles in degrees.

Equations
---------
Young–Laplace (cylinder):      p_c = 2 σ cos θ / r
Hagen–Poiseuille front:        dL/dt = r² Δp / (8 μ L)
Mode A (constant Δp):          L² = r² Δp t / (4 μ),   Δp = p_c + Δp_a
Mode B (dead-end, Boyle gas):  p_g = p_g0 L_p / (L_p − L)
                               ds/dt = r² (p_L + p_c − p_g) / (4 μ),  s = L²
Dimensionless Mode B:          y = (L/L_p)²,  t̂ = t / T,  T = 4 μ L_p² / (r² P),  P = p_L + p_c
                               dy/dt̂ = 1 − β / (1 − √y),  β = p_g0 / P
Exact Mode B results:          λ_eq = 1 − β
                               t̂(λ) = λ² − 2βλ + 2β(1 − β) ln[(1 − β)/(1 − β − λ)]
"""
from __future__ import annotations

import math

COS_ZERO_TOL = 1e-12


def cos_deg(theta_deg: float) -> float:
    """cos θ with cos(90°) returned as exactly 0."""
    c = math.cos(math.radians(theta_deg))
    return 0.0 if abs(c) < COS_ZERO_TOL else c


def capillary_pressure(sigma: float, theta_deg: float, r: float) -> float:
    """Young–Laplace capillary pressure for a cylindrical pore, Pa."""
    return 2.0 * sigma * cos_deg(theta_deg) / r


def washburn_coefficient(r: float, dp: float, mu: float) -> float:
    """D in L² = D t, m²/s."""
    return r * r * dp / (4.0 * mu)


def check_positive(**values: float) -> None:
    for name, v in values.items():
        if not (isinstance(v, (int, float)) and math.isfinite(v) and v > 0):
            raise ValueError(f"{name} must be a finite number greater than zero (got {v!r})")


# ---------------------------------------------------------------------- Mode A
def mode_a(r, sigma, theta_deg, mu, dp_applied, X, tau=1.0):
    """Open capillary. Returns a dict; time is math.inf when the net drive is not positive."""
    check_positive(r=r, sigma=sigma, mu=mu, X=X)
    if not 0.0 <= theta_deg <= 180.0:
        raise ValueError("theta_deg must lie between 0 and 180 degrees")
    if not tau >= 1.0:
        raise ValueError("tortuosity tau must be at least 1")
    pc = capillary_pressure(sigma, theta_deg, r)
    dp_total = pc + dp_applied
    L_path = tau * X
    if dp_total <= 0.0:
        return {"fills": False, "pc": pc, "dp_total": dp_total, "t_target": math.inf}
    D = washburn_coefficient(r, dp_total, mu)
    return {"fills": True, "pc": pc, "dp_total": dp_total, "D": D,
            "t_target": L_path * L_path / D}


# ---------------------------------------------------------------------- Mode B
def exact_time_hat(lam: float, beta: float) -> float:
    """Exact dimensionless time to reach fill fraction lam."""
    if beta == 0.0:
        return lam * lam
    a = 1.0 - beta
    if lam >= a:
        return math.inf
    return lam * lam - 2.0 * beta * lam + 2.0 * beta * a * math.log(a / (a - lam))


def _rk4_step(f, y, h):
    k1 = f(y)
    k2 = f(y + 0.5 * h * k1)
    k3 = f(y + 0.5 * h * k2)
    k4 = f(y + h * k3)
    return y + h * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0


def integrate_rk4_doubling(f, y0, tol=1e-11, h0=1e-6, stop=None, t_max=1e7, max_steps=400000):
    """Classical RK4 with step doubling: compare one step of h with two of h/2.

    f(y) may raise ValueError for unphysical states; the step is then halved.
    Returns lists t, y.
    """
    t, y, h = 0.0, y0, h0
    ts, ys = [t], [y]
    for _ in range(max_steps):
        if stop is not None and stop(y):
            return ts, ys, "stopped"
        if t >= t_max:
            return ts, ys, "t_max"
        try:
            big = _rk4_step(f, y, h)
            half = _rk4_step(f, _rk4_step(f, y, 0.5 * h), 0.5 * h)
            ok = math.isfinite(big) and math.isfinite(half)
        except ValueError:
            ok = False
        if not ok:
            h *= 0.25
            continue
        err = abs(half - big) / 15.0  # Richardson estimate of the error in `half`
        scale = tol * max(1.0, abs(half))
        if err <= scale:
            t += h
            y = half + (half - big) / 15.0  # Richardson extrapolation (5th order)
            ts.append(t)
            ys.append(y)
            h *= min(4.0, 0.9 * (scale / err) ** 0.2) if err > 0 else 4.0
        else:
            h *= max(0.1, 0.9 * (scale / err) ** 0.2)
        if h < 1e-300:
            return ts, ys, "underflow"
    return ts, ys, "max_steps"


def mode_b(r, sigma, theta_deg, mu, p_l, p_g0, L_p, tol=1e-12):
    """Dead-end capillary with trapped gas. Pressures are ABSOLUTE (Pa)."""
    check_positive(r=r, sigma=sigma, mu=mu, p_l=p_l, L_p=L_p)
    if p_g0 < 0:
        raise ValueError("p_g0 is an absolute pressure and cannot be negative")
    if L_p <= r:
        raise ValueError("pore length must exceed the pore radius")
    pc = capillary_pressure(sigma, theta_deg, r)
    P = p_l + pc
    if P - p_g0 <= 0.0:
        return {"fills": False, "pc": pc, "fill_eq": 0.0, "fill_num": 0.0}

    beta = p_g0 / P
    fill_eq = 1.0 - beta
    T = 4.0 * mu * L_p * L_p / (r * r * P)

    def f(y):
        if y < 0.0 or y >= 1.0:
            raise ValueError("front outside the pore")
        return 1.0 - beta / (1.0 - math.sqrt(y))

    def stop(y):
        # Same idea as the JavaScript solver: stop when a Newton estimate of the
        # remaining change in y, |f / f'|, is below 1e-9 * y.
        if beta == 0.0:
            return math.sqrt(max(y, 0.0)) >= 1.0 - 1e-9
        if y <= 0.0:
            return False
        lam = math.sqrt(y)
        dfdy = -beta / ((1.0 - lam) ** 2 * 2.0 * lam)
        return abs(f(y) / dfdy) <= 1e-9 * y

    # A tiny first step: f(y) involves √y, which is not smooth at y = 0.
    ts, ys, status = integrate_rk4_doubling(f, 0.0, tol=tol, h0=1e-10, stop=stop)
    lam = [math.sqrt(max(v, 0.0)) for v in ys]
    fill_num = lam[-1]

    # t95 from the numerical end state, located by bisection on a cubic Hermite
    # interpolant (uses y and dy/dt at both ends of the step that crosses).
    target = (0.95 * fill_num) ** 2
    t95 = None
    for i in range(1, len(ys)):
        if ys[i] >= target > ys[i - 1]:
            h = ts[i] - ts[i - 1]
            y0, y1, d0, d1 = ys[i - 1], ys[i], f(ys[i - 1]), f(ys[i])

            def p(u):
                return ((2 * u**3 - 3 * u**2 + 1) * y0 + (u**3 - 2 * u**2 + u) * h * d0
                        + (-2 * u**3 + 3 * u**2) * y1 + (u**3 - u**2) * h * d1 - target)

            lo, hi = 0.0, 1.0
            for _ in range(60):
                mid = 0.5 * (lo + hi)
                lo, hi = (mid, hi) if p(mid) < 0 else (lo, mid)
            t95 = (ts[i - 1] + 0.5 * (lo + hi) * h) * T
            break

    return {
        "fills": True, "pc": pc, "P": P, "beta": beta, "T": T,
        "fill_eq": fill_eq, "fill_num": fill_num, "status": status,
        "t95_num": t95, "t95_exact": exact_time_hat(0.95 * fill_eq, beta) * T,
        "t": [v * T for v in ts], "L": [v * L_p for v in lam],
    }


def baseline_report() -> str:
    """Plain-text summary of the baseline calculations (printed on the website)."""
    base = dict(r=0.5e-6, sigma=29.4e-3, theta_deg=30.0, mu=4.4e-3)
    pc = capillary_pressure(base["sigma"], base["theta_deg"], base["r"])
    lines = [f"p_c = {pc / 1e3:.2f} kPa",
             f"D   = {washburn_coefficient(base['r'], pc, base['mu']):.4e} m^2/s"]
    for X, tau in [(70e-6, 1), (0.01, 1), (0.05, 1), (0.05, 2)]:
        t = mode_a(**base, dp_applied=0.0, X=X, tau=tau)["t_target"]
        lines.append(f"t(X = {X * 100:g} cm, tau = {tau}) = {t:.4g} s = {t / 60:.4g} min")
    for pg0 in (101.3e3, 10e3, 1e3):
        b = mode_b(**base, p_l=101.3e3, p_g0=pg0, L_p=70e-6)
        lines.append(f"p_g0 = {pg0 / 1e3:6.1f} kPa: fill_eq = {b['fill_eq']:.5f}, "
                     f"fill_num = {b['fill_num']:.5f}, t95 = {b['t95_num'] * 1e3:.4f} ms")
    return "\n".join(lines)


if __name__ == "__main__":
    print(baseline_report())
