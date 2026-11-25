/** BoosterBar.jsx — Booster selection with inventory, cost, state (spec §39, §40, §41). */
import useProgressStore from '../store/useProgressStore.js';

const BOOSTERS = {
  aim: { icon: '🎯', name: 'Aim Guide', desc: 'Extends the trajectory line', toggle: true },
  bomb: { icon: '💣', name: 'Bomb', desc: 'Next bubble clears an area' },
  rainbow: { icon: '🌈', name: 'Rainbow', desc: 'Next bubble matches any color' },
  extraShot: { icon: '➕', name: 'Extra Shots', desc: '+5 shots' },
  shuffle: { icon: '🔀', name: 'Shuffle', desc: 'Rearrange bubble colors' },
};

export default function BoosterBar({ available = [], snapshot, controls, onMessage }) {
  const { boosterInventory, consumeBooster } = useProgressStore();

  const handle = (type) => {
    const def = BOOSTERS[type];
    // Toggle boosters (aim guide) don't consume inventory.
    if (!def.toggle) {
      if (!boosterInventory[type] || boosterInventory[type] <= 0) {
        onMessage?.(`No ${def.name} left`);
        return;
      }
    }
    const res = controls.useBooster(type);
    if (!res?.ok) {
      onMessage?.(res?.reason || 'Cannot use that now');
      return;
    }
    if (res.consume) consumeBooster(type);
    if (def.toggle) onMessage?.(res.toggled ? `${def.name} on` : `${def.name} off`);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {available.map((type) => {
        const def = BOOSTERS[type];
        if (!def) return null;
        const count = boosterInventory[type] ?? 0;
        const armed = snapshot?.armed === type || (type === 'aim' && snapshot?.longAim);
        const depleted = !def.toggle && count <= 0;
        return (
          <button
            key={type}
            onClick={() => handle(type)}
            disabled={depleted}
            title={`${def.name} — ${def.desc}`}
            className={`relative flex flex-col items-center rounded-2xl border px-3 py-2 transition ${
              armed ? 'border-brand-400 bg-brand-500/25 shadow-glow' : 'border-white/10 bg-white/5'
            } ${depleted ? 'opacity-40' : 'hover:bg-white/10 active:scale-95'}`}
          >
            <span className="text-xl">{def.icon}</span>
            <span className="text-[10px] font-semibold text-white/70">{def.name}</span>
            {!def.toggle && (
              <span className="absolute -right-1 -top-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-bold">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
