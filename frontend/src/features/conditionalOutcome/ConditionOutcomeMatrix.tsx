import type { ConditionOutcomeMatrixCounts } from './types'
import styles from './ConditionOutcomeMatrix.module.css'

type Props = {
  conditionLabel: string
  targetLabel: string
  matrix: ConditionOutcomeMatrixCounts
}

export function ConditionOutcomeMatrix({ conditionLabel, targetLabel, matrix }: Props) {
  const otherLabel = 'anderes Outcome'
  const presentLabel = conditionLabel || 'Bedingung vorhanden'
  const absentLabel = `ohne ${conditionLabel || 'Bedingung'}`

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Verteilung: {presentLabel} × {targetLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.corner}></th>
            <th scope="col">{targetLabel || 'Target'}</th>
            <th scope="col">{otherLabel}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{presentLabel}</th>
            <td>{matrix.presentTarget}</td>
            <td>{matrix.presentOther}</td>
          </tr>
          <tr>
            <th scope="row">{absentLabel}</th>
            <td>{matrix.absentTarget}</td>
            <td>{matrix.absentOther}</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.unclear}>
        <div className={styles.unclearTitle}>Unklare Fälle</div>
        <p>Bedingung unklar: {matrix.conditionUnclear}</p>
        <p>Outcome unklar: {matrix.outcomeUnclear}</p>
        <p className={styles.unclearNote}>
          Unklare Bedingungen gehören nicht in die beiden Vergleichssamples.
          Unklare Outcomes bleiben im Nenner der jeweiligen Bedingungsgruppe.
        </p>
      </div>
    </div>
  )
}
