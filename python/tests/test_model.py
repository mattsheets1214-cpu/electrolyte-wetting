"""pytest suite for the Python reference implementation.

Three independent checks of the same physics:
  1. closed-form reference cases shared with the JavaScript tests,
  2. SciPy's solve_ivp (Radau, an implicit method) integrating the ORIGINAL
     dimensional equation ds/dt = r²(p_L + p_c − p_g)/(4μ),
  3. the exact implicit trajectory t̂(λ).
Run:  python -m pytest python/tests -q
"""
import json
import math
from pathlib import Path

import pytest

from wetting import mode_a, mode_b, capillary_pressure, exact_time_hat

REF = json.loads((Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "reference_cases.json").read_text())
BASE = dict(r=0.5e-6, sigma=29.4e-3, theta_deg=30.0, mu=4.4e-3)


def rel(a, b):
    return abs(a - b) / abs(b)


@pytest.mark.parametrize("case", REF["modeA"], ids=lambda c: c["name"])
def test_mode_a_reference(case):
    k = case["inputs"]
    res = mode_a(k["r"], k["sigma"], k["thetaDeg"], k["mu"], k["dpApplied"], k["X"], k["tau"])
    if not case["expected"]["fills"]:
        assert res["fills"] is False and res["t_target"] == math.inf
    else:
        assert rel(res["pc"], case["expected"]["pc"]) < 1e-12
        assert rel(res["t_target"], case["expected"]["tTarget"]) < 1e-12


@pytest.mark.parametrize("case", REF["modeB"], ids=lambda c: c["name"])
def test_mode_b_reference(case):
    k = case["inputs"]
    res = mode_b(k["r"], k["sigma"], k["thetaDeg"], k["mu"], k["pL"], k["pg0"], k["Lp"])
    if not case["expected"]["fills"]:
        assert res["fills"] is False
        return
    assert rel(res["fill_num"], case["expected"]["fillEq"]) < 1e-7
    assert rel(res["t95_exact"], case["expected"]["t95"]) < 1e-12
    assert rel(res["t95_num"], case["expected"]["t95"]) < 1e-5


@pytest.mark.parametrize("pg0", [101.3e3, 30e3, 10e3, 1e3])
def test_mode_b_trajectory_matches_exact(pg0):
    res = mode_b(**BASE, p_l=101.3e3, p_g0=pg0, L_p=70e-6)
    worst = 0.0
    for t, L in zip(res["t"][1:], res["L"][1:]):
        lam = L / 70e-6
        if lam < 0.99 * res["fill_eq"]:  # t(λ) is ill-conditioned right at equilibrium
            worst = max(worst, rel(t, exact_time_hat(lam, res["beta"]) * res["T"]))
    assert worst < 1e-6


@pytest.mark.parametrize("pg0", [101.3e3, 10e3, 1e3])
def test_against_scipy_radau(pg0):
    scipy = pytest.importorskip("scipy.integrate")
    r, sigma, theta, mu, p_l, L_p = 0.5e-6, 29.4e-3, 30.0, 4.4e-3, 101.3e3, 70e-6
    pc = capillary_pressure(sigma, theta, r)

    def rhs(_t, s):
        L = math.sqrt(max(s[0], 0.0))
        p_g = pg0 * L_p / (L_p - L)
        return [r * r * (p_l + pc - p_g) / (4 * mu)]

    ours = mode_b(r, sigma, theta, mu, p_l, pg0, L_p)
    sol = scipy.solve_ivp(rhs, (0.0, ours["t"][-1]), [0.0], method="Radau",
                          rtol=1e-11, atol=1e-24, dense_output=True)
    assert sol.success
    for t, L in zip(ours["t"][1::25], ours["L"][1::25]):
        L_scipy = math.sqrt(sol.sol(t)[0])
        assert rel(L, L_scipy) < 1e-6
    assert rel(math.sqrt(sol.y[0, -1]) / L_p, ours["fill_eq"]) < 1e-6


def test_scalings():
    t = lambda **k: mode_a(**{**BASE, "dp_applied": 0.0, "X": 0.01, **k})["t_target"]
    assert rel(t(mu=8.8e-3) / t(), 2) < 1e-12
    assert rel(t(X=0.02) / t(), 4) < 1e-12
    assert rel(t(r=1e-6) / t(), 0.5) < 1e-12
    fixed = lambda r: mode_a(r, 29.4e-3, 90.0, 4.4e-3, 100e3, 0.01)["t_target"]
    assert rel(fixed(1e-6) / fixed(0.5e-6), 0.25) < 1e-12


@pytest.mark.parametrize("bad", [dict(r=0), dict(r=-1e-6), dict(mu=0), dict(sigma=0)])
def test_invalid_inputs_raise(bad):
    with pytest.raises(ValueError):
        mode_a(**{**BASE, **bad}, dp_applied=0.0, X=0.01)


def test_invalid_tortuosity_and_angle():
    with pytest.raises(ValueError):
        mode_a(**BASE, dp_applied=0.0, X=0.01, tau=0.5)
    with pytest.raises(ValueError):
        mode_a(**{**BASE, "theta_deg": 190.0}, dp_applied=0.0, X=0.01)
    with pytest.raises(ValueError):
        mode_b(**BASE, p_l=101.3e3, p_g0=-1.0, L_p=70e-6)
