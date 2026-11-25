import { GAME_NAME } from '../config/gameConfig.js';
import Character from '../components/Character.jsx';

export default function Help() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Character size={72} />
        <div>
          <h1 className="font-display text-4xl font-extrabold">How to play {GAME_NAME}</h1>
          <p className="text-white/60">Bubbo's quick guide</p>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="🎯 Aiming">
          Move your mouse (or drag on mobile) to aim the launcher. A dotted trajectory shows where your
          bubble will go, including bounces off the side walls.
        </Section>
        <Section title="🫧 Shooting & Matching">
          Click, tap-release, or press Space to fire. Connect <strong>3 or more</strong> bubbles of the same
          color to pop them. Bigger groups score more.
        </Section>
        <Section title="💥 Chain reactions">
          When a pop leaves bubbles disconnected from the ceiling, they fall for bonus points — plan shots
          that trigger big drops.
        </Section>
        <Section title="🎉 Objectives">
          Each level has a goal: clear all bubbles, rescue hidden friends, hit a target score, clear a
          color, or finish within the shot limit.
        </Section>
        <Section title="🧪 Boosters">
          Use the Aim Guide, Bomb, Rainbow, Extra Shots, and Shuffle to get out of tricky spots. Each has
          real in-game effects and a limited inventory.
        </Section>
        <Section title="⭐ Stars">
          Earn up to 3 stars per level based on your score and shot efficiency. Stars unlock bragging
          rights on the leaderboard.
        </Section>
        <Section title="🎮 Controls">
          <ul className="ml-5 list-disc text-white/70">
            <li>Desktop: mouse to aim, click or Space to shoot, R to restart, Esc to pause.</li>
            <li>Mobile: drag to aim, release to shoot, tap boosters, pause button in the HUD.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h2 className="mb-2 font-display text-xl font-bold">{title}</h2>
      <div className="text-white/70">{children}</div>
    </div>
  );
}
