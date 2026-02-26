import { useUser } from '../context/UserContext';
import styles from './TopNav.module.css';

export default function UserName() {
  const { user } = useUser();
  if (!user) return null;
  return (
    <div className={styles.userLine}>
      Angemeldet: <strong>{user}</strong>
    </div>
  );
}
