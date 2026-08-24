import { useRewards } from '../state/RewardContext'
import { useUser } from '../../../context/UserContext'
import {
  isFloatingRewardDevToolsEnabled,
  REWARD_PREVIEW_BRONZE,
  REWARD_PREVIEW_GOLD,
  REWARD_PREVIEW_MASTERY,
  REWARD_PREVIEW_QUEUE,
  REWARD_PREVIEW_SESSION_QUEUE,
  REWARD_PREVIEW_SILVER,
} from '../../../dev/rewardPreviewActions'

export default function RewardDevTools() {
  const { user } = useUser()
  const { enqueueReward, enqueueRewards } = useRewards()

  const forceEnabled = isFloatingRewardDevToolsEnabled()
  if (!user && !forceEnabled) return null
  if (!forceEnabled) return null

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
      <button className="btn" style={{ minWidth: 110, fontSize: '0.82rem' }} onClick={() => enqueueReward(REWARD_PREVIEW_BRONZE)}>
        Bronze
      </button>
      <button className="btn" style={{ minWidth: 110, fontSize: '0.82rem' }} onClick={() => enqueueReward(REWARD_PREVIEW_SILVER)}>
        Silver
      </button>
      <button className="btn" style={{ minWidth: 110, fontSize: '0.82rem' }} onClick={() => enqueueReward(REWARD_PREVIEW_GOLD)}>
        Gold
      </button>
      <button className="btn" style={{ minWidth: 110, fontSize: '0.82rem' }} onClick={() => enqueueReward(REWARD_PREVIEW_MASTERY)}>
        Mastery
      </button>
      <button
        className="btn"
        style={{ minWidth: 130, fontSize: '0.82rem' }}
        onClick={() => enqueueRewards([...REWARD_PREVIEW_QUEUE])}
      >
        Queue B→S→G
      </button>
      <button
        className="btn"
        style={{ minWidth: 150, fontSize: '0.82rem' }}
        onClick={() => enqueueRewards([...REWARD_PREVIEW_SESSION_QUEUE])}
      >
        Queue Session
      </button>
    </div>
  )
}
