import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__content">
        <section aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title" className="h5">
            Région Auvergne-Rhône-Alpes
          </h2>
          <address>
            101 cours Charlemagne
            <br />
            CS 20033
            <br />
            69269 Lyon Cedex 02
            <br />
            France
          </address>
          <a href="tel:+33426734000">+33 (0)4 26 73 40 00</a>
        </section>
        <nav aria-label="Informations légales">
          <ul className="site-footer__links">
            <li>
              <Link to="/mentions-legales">Mentions légales</Link>
            </li>
            <li>
              <Link to="/donnees-personnelles">Données personnelles</Link>
            </li>
            <li>
              <Link to="/accessibilite">Accessibilité</Link>
            </li>
            <li>
              <Link to="/cookies">Cookies</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
