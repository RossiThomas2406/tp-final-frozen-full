import styles from './Footer.module.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
        <p className={styles.copyright}>
          © {currentYear} FROZENAPP. Todos los derechos reservados.
        </p>
    </footer>
  );
}

export default Footer;