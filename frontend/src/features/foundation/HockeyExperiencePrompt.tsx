import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import type { HockeyExperienceLevel } from './types'
import styles from './HockeyExperiencePrompt.module.css'

type Props = {
  open: boolean
  onDone: () => void
}

const OPTIONS: Array<{ value: HockeyExperienceLevel; title: string; desc: string }> = [
  {
    value: 'beginner',
    title: 'Neu bei Hockey',
    desc: 'Ich kenne Regeln und Begriffe kaum.',
  },
  {
    value: 'familiar',
    title: 'Grundlagen bekannt',
    desc: 'Ich kenne Hockey und die wichtigsten Regeln.',
  },
  {
    value: 'advanced',
    title: 'Taktisch erfahren',
    desc: 'Ich möchte direkt mit taktischer Beobachtung starten.',
  },
]

export default function HockeyExperiencePrompt({ open, onDone }: Props) {
  const queryClient = useQueryClient()
  const { data: account } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe(),
    enabled: open,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: {
      hockeyExperience?: HockeyExperienceLevel | null
      experiencePromptDismissed?: boolean
    }) => api.updateMyProfile(payload as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      onDone()
    },
  })

  if (!open) return null

  const profile = account?.profile

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="hockey-exp-title">
      <div className={styles.panel}>
        <h2 id="hockey-exp-title" className={styles.title}>
          Wie vertraut bist du mit Hockey?
        </h2>
        <p className={styles.lead}>
          Damit wir dir den passenden Einstieg vorschlagen können. Du kannst Track 0 jederzeit überspringen.
        </p>

        <div className={styles.options}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={styles.option}
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  hockeyExperience: opt.value,
                  experiencePromptDismissed: true,
                })
              }
            >
              <strong>{opt.title}</strong>
              <span>{opt.desc}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.skip}
          disabled={saveMutation.isPending}
          onClick={() =>
            saveMutation.mutate({
              hockeyExperience: profile?.hockeyExperience ?? 'familiar',
              experiencePromptDismissed: true,
            })
          }
        >
          Basics überspringen
        </button>

        {saveMutation.isError && (
          <p className={styles.error}>Speichern fehlgeschlagen. Bitte erneut versuchen.</p>
        )}
      </div>
    </div>
  )
}
