import React from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";
import { useLocation } from "react-router-dom";
import { store } from "../../lib";
import { getTranslation } from "../../util";

const Footer = ({ className = "footer", ...props }) => {
  const location = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "footer");
  if (
    location.pathname.includes("/login") ||
    location.pathname.includes("/report/")
  ) {
    return "";
  }
  const footerExternalLinkItems = [
    {
      text: "JMP",
      url: "https://washdata.org/how-we-work/about-jmp#:~:text=Background,hygiene%20(WASH)%20since%201990",
    },
    {
      text: "CLTS NWMIS",
      url: " http://wash.health.go.ke/clts/index.jsp",
    },
    {
      text: "GLAAS",
      url: "https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/monitoring-and-evidence/wash-systems-monitoring/un-water-global-analysis-and-assessment-of-sanitation-and-drinking-water",
    },
  ];
  const footerResourcesItems = [
    {
      text: "International Resources",
      url: "#",
    },
    {
      text: "National Resources",
      url: "#",
    },
    {
      text: "County Resources",
      url: "#",
    },
  ];
  const footerQuickLinkItems = [
    {
      text: "Read the Docs",
      url: "/documentation/",
    },
  ];
  return (
    <div className={className}>
      <Row align="top" justify="space-between" {...props}>
        <Col span={8}>
          <h2>{text?.footerAboutTitle}</h2>
          <p>{text?.footerAboutDescription}</p>
          {footerQuickLinkItems?.map((x, xi) => (
            <a
              key={`quick-link-${xi}`}
              className="link-inline"
              target="_blank"
              rel="noreferrer"
              href={x.url}
            >
              {x.text}
            </a>
          ))}
        </Col>
        <Col span={4}>
          <h2>{text?.footerExternalLinkTitle}</h2>
          <ul>
            {footerExternalLinkItems.map((x, xi) => (
              <li key={`ext-link-${xi}`}>
                <a target="_blank" rel="noreferrer" href={x.url}>
                  {x.text}
                </a>
              </li>
            ))}
          </ul>
        </Col>
        <Col span={4}>
          <h2>{text?.footerResourcesTitle}</h2>
          <ul>
            {footerResourcesItems.map((x, xi) => (
              <li key={`ext-link-${xi}`}>
                <a target="_blank" rel="noreferrer" href={x.url}>
                  {x.text}
                </a>
              </li>
            ))}
          </ul>
        </Col>
        <Col span={6}>
          <h2>{text?.footerContactTitle}</h2>
          <p>{text?.footerContactAddress}</p>
          <ul>
            <li>
              {text?.phone}:
              <a
                target="_blank"
                rel="noreferrer"
                href={`tel:${text?.footerContactPhone}`}
              >
                {text?.footerContactPhone}
              </a>
            </li>
            <li>
              {text?.email}:
              <a
                target="_blank"
                rel="noreferrer"
                href={`mailto:${text?.footerContactEmail}`}
              >
                {text?.footerContactEmail}
              </a>
            </li>
            {/*
            <li>
              <a
                className="ant-btn ant-btn-sm ant-btn-ghost"
                target="_blank"
                rel="noreferrer"
                href={text?.footerContactFeedback?.url}
              >
                <b>{text?.footerContactFeedback?.text}</b>
              </a>
            </li>
            */}
          </ul>
        </Col>
      </Row>
      <Row className="end" align="top" justify="space-between" {...props}>
        <Col>{text?.copyright}</Col>
        <Col>
          <a href="https://www.akvo.org" target="_blank" rel="noreferrer">
            Akvo
          </a>
        </Col>
      </Row>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
