import React from "react";
import PropTypes from "prop-types";
import {
  Row,
  Col,
  //  Button,
  //  Space
} from "antd";
import {
  // Link,
  useLocation,
} from "react-router-dom";
import { config } from "../../lib";

const Footer = ({ className = "footer", ...props }) => {
  const location = useLocation();
  if (location.pathname.includes("/login")) {
    return "";
  }
  return (
    <div className={className}>
      <Row align="top" justify="space-between" {...props}>
        <Col span={6}>
          <h3>About Data</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a
            gravida arcu. Donec et tristique augue. Nullam neque magna,
            imperdiet in fermentum sit amet, sollicitudin quis sapien. Morbi
            ullamcorper tincidunt ligula, et malesuada purus.
          </p>
        </Col>
        <Col span={6}>
          <h3>Contact</h3>
          <ul>
            <li>Phone : +254 123436789</li>
            <li>Email : info@nashrtmis.co.ke</li>
          </ul>
          {/* <Button className="dev" size="small">
            Contact Us
          </Button> */}
        </Col>
        <Col span={6}>
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://washdata.org/how-we-work/about-jmp#:~:text=Background,hygiene%20(WASH)%20since%201990"
              >
                JMP
              </a>
            </li>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.communityledtotalsanitation.org/country/kenya"
              >
                CLTS
              </a>
            </li>
            <li>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/monitoring-and-evidence/wash-systems-monitoring/un-water-global-analysis-and-assessment-of-sanitation-and-drinking-water"
              >
                GLASS
              </a>
            </li>
          </ul>
        </Col>
        {/* <Col span={3}>
          <div className="footer-logo">
            <img src={config.siteLogo} alt={config.siteLogo} />
            <h3>MOH</h3>
          </div>
        </Col> */}
      </Row>
      <Row className="end" align="top" justify="space-between" {...props}>
        <Col>Copyright 2021</Col>
        {/* <Col>
          <Space>
            <Link to="terms" className="dev">
              Terms of Service
            </Link>
            <Link to="privacy-policy" className="dev">
              Privacy Policy
            </Link>
          </Space>
        </Col> */}
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
