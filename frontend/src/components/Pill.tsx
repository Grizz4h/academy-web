import React from 'react';
import styles from './Pill.module.css';

interface PillProps {
  children: React.ReactNode;
  className?: string;
}

const Pill: React.FC<PillProps> = ({ children, className = '' }) => (
  <span className={`${styles.pill} ${className}`}>
    {children}
  </span>
);

export default Pill;
