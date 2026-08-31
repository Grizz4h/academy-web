import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import styles from './TopNav.module.css';

export default function LogoutButton() {
  const { logout, user } = useUser();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <button
      type="button"
      onClick={() => {
        logout();
        navigate('/', { replace: true });
      }}
      className={styles.logoutBtn}
    >
      Logout
    </button>
  );
}
