import React from 'react';
import styles from './Card.module.css';

export type CardSurface = 'primary' | 'section' | 'nested' | 'inline';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** quiet = secondary info · default = standard · featured = primary presence */
  elevation?: 'quiet' | 'default' | 'featured';
  /**
   * Layout role in the responsive surface system.
   * - primary: dominant page/block surface (keeps chrome on mobile)
   * - section: page section card → flattens on mobile
   * - nested: inner panel → fully flat on mobile
   * - inline: light tint panel → flat on mobile
   */
  surface?: CardSurface;
  /** Force mobile flatten even for primary surfaces */
  flatOnMobile?: boolean;
}

const SURFACE_CLASS: Record<CardSurface, string> = {
  primary: 'ui-surface ui-surface--primary primary-card',
  section: 'ui-surface ui-surface--section',
  nested: 'ui-surface ui-surface--nested',
  inline: 'ui-surface ui-surface--inline',
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevation = 'default',
  surface,
  flatOnMobile,
}) => {
  const shouldFlat =
    flatOnMobile === true ||
    (flatOnMobile !== false && surface != null && surface !== 'primary');

  return (
    <div
      className={[
        styles.card,
        elevation === 'quiet' ? styles.quiet : '',
        elevation === 'featured' ? styles.featured : '',
        surface ? SURFACE_CLASS[surface] : '',
        shouldFlat ? 'ui-flat-mobile' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
};

export default Card;
