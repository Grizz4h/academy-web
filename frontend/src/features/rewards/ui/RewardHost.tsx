import { useRewards } from '../state/RewardContext'
import RewardPopup from './RewardPopup'

export default function RewardHost() {
  const { activeReward, closeActiveReward, isRewardVisible } = useRewards()

  if (!activeReward) return null

  return <RewardPopup event={activeReward} isVisible={isRewardVisible} onClose={closeActiveReward} />
}
