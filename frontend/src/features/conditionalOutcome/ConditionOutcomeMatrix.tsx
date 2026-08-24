import type { ConditionOutcomeMatrixCounts } from './types'
import styles from './ConditionOutcomeMatrix.module.css'

type Props = {
  conditionLabel: string
  targetLabel: string
  matrix: ConditionOutcomeMatrixCounts
}

export function ConditionOutcomeMatrix({ conditionLabel, targetLabel, matrix }: Props) {
  const otherLabel = 'anderes Ergebnis'
  const presentLabel = conditionLabel || 'Bedingung vorhanden'
  const absentLabel = `ohne ${conditionLabel || 'Bedingung'}`
  const counterPresentOther = matrix.presentOther
  const counterAbsentTarget = matrix.absentTarget

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Bedingtes Zusammenauftreten: {presentLabel} × {targetLabel || 'Zielereignis'}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.corner}></th>
            <th scope="col">{targetLabel || 'Zielereignis'}</th>
            <th scope="col">{otherLabel}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{presentLabel}</th>
            <td>{matrix.presentTarget}</td>
            <td>
              {counterPresentOther}
              {counterPresentOther > 0 ? ' · Gegenfall-Kandidat' : ''}
            </td>
          </tr>
          <tr>
            <th scope="row">{absentLabel}</th>
            <td>
              {counterAbsentTarget}
              {counterAbsentTarget > 0 ? ' · Gegenfall-Kandidat' : ''}
            </td>
            <td>{matrix.absentOther}</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.unclear}>
        <div className={styles.unclearTitle}>Unklare Fälle (getrennt)</div>
        <p>Bedingung unklar: {matrix.conditionUnclear}</p>
        <p>Ergebnis unklar: {matrix.outcomeUnclear}</p>
        <p className={styles.unclearNote}>
          Unklare Bedingungen gehören nicht in die Vergleichsgruppen.
          Unklare Ergebnisse bleiben in der Gesamtzahl gültiger Situationen, zählen aber nicht als Misserfolg im auswertbaren Nenner.
          Gegenfälle begrenzen oder schärfen eine Aussage — sie widerlegen einen Zusammenhang nicht automatisch.
        </p>
      </div>
    </div>
  )
}
