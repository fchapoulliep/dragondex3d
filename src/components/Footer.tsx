/**
 * Importing React and the footer CSS.
 */
import React from "react";
import "../css/footer.css";

/**
 * Footer component that displays the footer section of the application.
 *
 * This component includes:
 * - Copyright information with the current year.
 * - Links to the portfolio, GitHub, and LinkedIn profiles.
 * - Credits for the design.
 *
 * @component
 * @example
 * return (
 *   <Footer />
 * )
 */
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* data-nosnippet keeps Google from quoting the footer under the page title:
          the home pages have little text, and Google picked the copyright line */}
      <div className="footer-copyrights" data-nosnippet>
        <p>
          &copy; {new Date().getFullYear()} Florian Chapoullié-Pino. All rights
          reserved.
        </p>
      </div>
      <div className="footer-links" data-nosnippet>
        <a
          href="https://fchapoulliep.github.io/portfolio/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Portfolio
        </a>
        <a
          href="https://github.com/fchapoulliep"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/florianpino/"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </div>
      <div className="footer-credits" data-nosnippet>
        <p>
          Designed by <b>Florian Chapoullié-Pino</b>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
