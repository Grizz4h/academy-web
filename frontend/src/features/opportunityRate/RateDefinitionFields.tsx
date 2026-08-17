import {
  addBlankOutcome,
  applyTemplateById,
  composeQuestion,
  emptyCustomDefinition,
  isDefinitionReady,
  removeOutcome,
  updateDefinitionLabels,
} from './rateLogic'
import type {
  RateDefinition,
  RateExamplesHelp,
  RateOutcomeDefinition,
  RateTemplate,
} from './types'
import styles from './OpportunityRateDrill.module.css'

type Props = {
  definition: RateDefinition | null
  templates: RateTemplate[]
  allowTemplates: boolean
  allowCustomDefinition: boolean
  unclearOutcomeId: string
  onChange: (next: RateDefinition) => void
  continueLabel: string
  onContinue: (definition: RateDefinition) => void
  metricScopeNote?: string
}

export function RateExamplesAccordion({ help }: { help: RateExamplesHelp }) {
  return (
    <details className={`${styles.examplesHelp} ui-flat-mobile mobile-flatten`}>
      <summary className={styles.examplesSummary}>{help.title}</summary>
      <div className={styles.examplesBody}>
        {help.intro && <p className={styles.examplesIntro}>{help.intro}</p>}
        {help.suitable.length > 0 && (
          <ul className={styles.examplesList}>
            {help.suitable.map((example) => (
              <li key={example.title} className={styles.exampleItem}>
                <p className={styles.exampleTitle}>{example.title}</p>
                <p className={styles.exampleDescription}>{example.description}</p>
              </li>
            ))}
          </ul>
        )}
        {help.unsuitable.length > 0 && (
          <>
            <p className={styles.unsuitableTitle}>{help.unsuitableTitle}</p>
            <ul className={styles.unsuitableList}>
              {help.unsuitable.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
        {help.footer && <p className={styles.examplesFooter}>{help.footer}</p>}
      </div>
    </details>
  )
}

export function RateDefinitionFields({
  definition,
  templates,
  allowTemplates,
  allowCustomDefinition,
  unclearOutcomeId,
  onChange,
  continueLabel,
  onContinue,
  metricScopeNote,
}: Props) {
  const ready = isDefinitionReady(definition, unclearOutcomeId)

  return (
    <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
      <h3 className={styles.panelTitle}>Messfrage definieren</h3>
      <p className={styles.lead}>
        Alle Situationen, in denen das Target Event hätte eintreten können, gehören in den Nenner.
        {metricScopeNote ? ` ${metricScopeNote}` : ''}
      </p>

      {allowTemplates && templates.length > 0 && (
        <div className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>Optionale Templates</div>
          <div className={styles.templateRow}>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`${styles.templateBtn} ${definition?.templateId === template.id ? styles.templateBtnActive : ''}`}
                onClick={() => onChange(applyTemplateById(template.id, unclearOutcomeId)!)}
              >
                <span>{template.title}</span>
                <small>{template.description}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {allowCustomDefinition && (
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => onChange(emptyCustomDefinition())}
        >
          Frei definieren
        </button>
      )}

      {definition && (
        <>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welche Situationen zählen als Opportunity?</div>
            <input
              className={styles.input}
              value={definition.opportunityLabel}
              maxLength={160}
              placeholder="z. B. jeder gegnerische Zone-Entry-Versuch"
              onChange={(event) => onChange(updateDefinitionLabels(definition, {
                opportunityLabel: event.target.value,
                questionManual: definition.questionManual,
              }))}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welches Outcome möchtest du zählen?</div>
            <input
              className={styles.input}
              value={definition.targetEventLabel}
              maxLength={160}
              placeholder="z. B. kontrollierter Entry mit Puckbesitz"
              onChange={(event) => onChange(updateDefinitionLabels(definition, {
                targetEventLabel: event.target.value,
                questionManual: definition.questionManual,
              }))}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Messfrage</div>
            <textarea
              className={styles.textarea}
              value={definition.question || composeQuestion(definition.opportunityLabel, definition.targetEventLabel)}
              maxLength={240}
              onChange={(event) => onChange(updateDefinitionLabels(definition, {
                question: event.target.value,
                questionManual: true,
              }))}
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Mögliche Outcomes</div>
            <div className={styles.outcomeEditor}>
              {definition.outcomes.map((outcome) => (
                <OutcomeEditorRow
                  key={outcome.id}
                  outcome={outcome}
                  isTarget={outcome.id === definition.targetOutcomeId}
                  isUnclear={outcome.id === unclearOutcomeId}
                  onLabelChange={(label) => {
                    const outcomes = definition.outcomes.map((item) => (
                      item.id === outcome.id ? { ...item, label } : item
                    ))
                    onChange({ ...definition, outcomes })
                  }}
                  onTarget={() => onChange({ ...definition, targetOutcomeId: outcome.id })}
                  onRemove={() => onChange(removeOutcome(definition, outcome.id, unclearOutcomeId))}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => onChange(addBlankOutcome(definition, unclearOutcomeId))}
            >
              + Outcome
            </button>
          </div>
        </>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!ready}
          onClick={() => {
            if (!definition || !ready) return
            onContinue(definition)
          }}
        >
          {continueLabel}
        </button>
      </div>
    </section>
  )
}

function OutcomeEditorRow({
  outcome,
  isTarget,
  isUnclear,
  onLabelChange,
  onTarget,
  onRemove,
}: {
  outcome: RateOutcomeDefinition
  isTarget: boolean
  isUnclear: boolean
  onLabelChange: (label: string) => void
  onTarget: () => void
  onRemove: () => void
}) {
  return (
    <div className={styles.outcomeRow}>
      <input
        className={styles.input}
        value={outcome.label}
        maxLength={80}
        placeholder={isUnclear ? 'Unklar' : 'Outcome-Label'}
        onChange={(event) => onLabelChange(event.target.value)}
      />
      <div className={styles.outcomeRowActions}>
        {!isUnclear && (
          <button
            type="button"
            className={isTarget ? styles.templateBtnActive : styles.secondaryBtn}
            onClick={onTarget}
          >
            {isTarget ? 'Target' : 'Als Target'}
          </button>
        )}
        {!isUnclear && !isTarget && (
          <button type="button" className={styles.secondaryBtn} onClick={onRemove}>
            Entfernen
          </button>
        )}
      </div>
    </div>
  )
}
