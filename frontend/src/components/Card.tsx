import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** quiet = secondary info · default = standard · featured = primary presence */
  elevation?: 'quiet' | 'default' | 'featured';
}

const Card: React.FC<CardProps> = ({ children, className = '', elevation = 'default' }) => (
  <div
    className={[
      styles.card,
      elevation === 'quiet' ? styles.quiet : '',
      elevation === 'featured' ? styles.featured : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);

export default Card;
