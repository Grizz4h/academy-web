import { useRewards } from '../state/RewardContext'
import { useUser } from '../../../context/UserContext'

export default function RewardDevTools() {
  const { user } = useUser()
  const { enqueueReward, enqueueRewards } = useRewards()

  const forceEnabled =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('rewardsDebug') === '1' ||
      localStorage.getItem('academy.devRewards') === '1')

  if (!user && !forceEnabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 1200,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {/* ── Bronze ── */}
      <button
        className="btn"
        style={{ minWidth: 110, fontSize: '0.82rem' }}
        onClick={() =>
          enqueueReward({
            kind: 'achievement',
            title: 'Bronze Unlock',
            description: 'Kleiner Fortschritt freigeschaltet.',
            amountPux: 10,
            visualTier: 'bronze',
            icon: '1',
            variant: 'popup',
          })
        }
      >
        🥉 Bronze
      </button>

      {/* ── Silver ── */}
      <button
        className="btn"
        style={{ minWidth: 110, fontSize: '0.82rem' }}
        onClick={() =>
          enqueueReward({
            kind: 'achievement',
            title: 'Silver Unlock',
            description: 'Stärkerer Reward freigeschaltet.',
            amountPux: 25,
            visualTier: 'silver',
            icon: '10',
            variant: 'popup',
          })
        }
      >
        🥈 Silver
      </button>

      {/* ── Gold ── */}
      <button
        className="btn"
        style={{ minWidth: 110, fontSize: '0.82rem' }}
        onClick={() =>
          enqueueReward({
            kind: 'achievement',
            title: 'Gold Unlock',
            description: 'Besonderes Achievement freigeschaltet.',
            amountPux: 50,
            visualTier: 'gold',
            icon: '50',
            variant: 'popup',
          })
        }
      >
        🥇 Gold
      </button>

      {/* ── Mastery ── */}
      <button
        className="btn"
        style={{ minWidth: 110, fontSize: '0.82rem' }}
        onClick={() =>
          enqueueReward({
            kind: 'mastery',
            title: 'Mastery Unlock',
            description: 'Höchste Stufe. Seltene Auszeichnung.',
            amountPux: 100,
            visualTier: 'mastery',
            icon: 'M',
            variant: 'hero',
            mastery: 'mastery',
          })
        }
      >
        👑 Mastery
      </button>

      {/* ── Full queue: Bronze → Silver → Gold ── */}
      <button
        className="btn"
        style={{ minWidth: 130, fontSize: '0.82rem' }}
        onClick={() =>
          enqueueRewards([
            {
              kind: 'achievement',
              title: 'Bronze Unlock',
              description: 'Kleiner Fortschritt freigeschaltet.',
              amountPux: 10,
              visualTier: 'bronze',
              icon: '1',
              variant: 'popup',
            },
            {
              kind: 'achievement',
              title: 'Silver Unlock',
              description: 'Stärkerer Reward freigeschaltet.',
              amountPux: 25,
              visualTier: 'silver',
              icon: '10',
              variant: 'popup',
            },
            {
              kind: 'achievement',
              title: 'Gold Unlock',
              description: 'Besonderes Achievement freigeschaltet.',
              amountPux: 50,
              visualTier: 'gold',
              icon: '50',
              variant: 'popup',
            },
          ])
        }
      >
        ▶ Queue B→S→G
      </button>
    </div>
  )
}
