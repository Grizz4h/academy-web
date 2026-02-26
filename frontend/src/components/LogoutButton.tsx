import { useUser } from '../context/UserContext';
import styles from './TopNav.module.css';

export default function LogoutButton() {
  const { logout, user } = useUser();
  if (!user) return null;
  return (
    <button
      type="button"
      onClick={logout}
      className={styles.logoutBtn}
    >
      Logout
    </button>
  );
}
