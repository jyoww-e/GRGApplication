"use strict";
// Work out which recycler units should pay out a given amount.
// units: [{ unit: 1..4, denom: 100, count: 25 }]  ->  [{ unit, denom, count }] or null if impossible.
function planPayout(amount, units) {
  const list = units
    .filter((u) => u.denom > 0 && u.count > 0)
    .sort((a, b) => b.denom - a.denom);
  const memo = new Map();
  function solve(i, remaining) {
    if (remaining === 0) return [];
    if (i >= list.length) return null;
    const key = i + ":" + remaining;
    if (memo.has(key)) return memo.get(key);
    const u = list[i];
    let result = null;
    for (
      let n = Math.min(u.count, Math.floor(remaining / u.denom));
      n >= 0;
      n--
    ) {
      // prefer big notes
      const rest = solve(i + 1, remaining - n * u.denom);
      if (rest) {
        result =
          n > 0 ? [{ unit: u.unit, denom: u.denom, count: n }, ...rest] : rest;
        break;
      }
    }
    memo.set(key, result);
    return result;
  }
  return solve(0, amount);
}

// Split a plan into hardware-sized rounds: at most 4 units and 35 notes per unit per command.
function splitRounds(plan, maxPerUnit = 35) {
  const left = plan.map((p) => ({ ...p }));
  const rounds = [];
  while (left.some((p) => p.count > 0)) {
    rounds.push(
      left
        .filter((p) => p.count > 0)
        .map((p) => {
          const n = Math.min(p.count, maxPerUnit);
          p.count -= n;
          return { unit: p.unit, denom: p.denom, count: n };
        }),
    );
  }
  return rounds;
}

module.exports = { planPayout, splitRounds };
