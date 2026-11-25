import React from 'react';
import { GAME_NAME } from '../config/gameConfig.js';

/** Catches render errors and shows a friendly, branded fallback (spec §82). */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log client-side only; never surface stack traces to the player.
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="card max-w-md">
            <div className="text-5xl mb-3">🫧</div>
            <h1 className="font-display text-2xl font-bold mb-2">{GAME_NAME} hit a snag</h1>
            <p className="text-white/70 mb-5">Something popped unexpectedly. Reloading usually fixes it.</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
