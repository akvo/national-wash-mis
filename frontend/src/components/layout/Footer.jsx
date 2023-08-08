import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Row, Col, Modal, Button } from "antd";
import { useLocation } from "react-router-dom";
import { store } from "../../lib";
import { getTranslation } from "../../util";
import { QRCodeSVG } from "qrcode.react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined, CheckCircleFilled } from "@ant-design/icons";

const Footer = ({ className = "footer", ...props }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "footer");

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  if (
    location.pathname.includes("/login") ||
    location.pathname.includes("/report/")
  ) {
    return "";
  }
  const footerExternalLinkItems = [
    {
      text: "https://eauburkina.com",
      url: "https://eauburkina.com/",
    },
    {
      text: "https://www.environnement.gov.bf/accueil",
      url: "https://www.environnement.gov.bf/accueil",
    },
    {
      text: "Direction Générale de l'Assainissement des Eaux Usées et Excreta",
      url: "https://www.facebook.com/p/Direction-G%C3%A9n%C3%A9rale-de-lAssainissement-des-Eaux-Us%C3%A9es-et-Excreta-100069316415266",
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
          <span
            className="link-inline"
            onClick={() => setModalVisible((modalVisible) => !modalVisible)}
          >
            {text?.apkDownloadTitle}
          </span>
        </Col>
        <Col span={6}>
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
      <Modal
        centered
        title={text?.apkDownloadTitle}
        visible={modalVisible}
        onCancel={() => setModalVisible((modalVisible) => !modalVisible)}
        width={350}
        footer={null}
      >
        <Row align="middle">
          <Col span={24} align="center">
            {text?.apkDownloadParagraph}
          </Col>
          <Col span={24} align="center">
            <br />
            <QRCodeSVG
              size={300}
              value={`${window.location.origin}/app`}
              level="H"
            />
            <br />
            <a
              href={`${window.location.origin}/app`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#000" }}
            >
              <b>{window.location.origin}/app</b>
            </a>
            <br />
            <br />
            <CopyToClipboard
              text={`${window.location.origin}/app`}
              onCopy={() => setCopied(true)}
            >
              <Button
                type="secondary"
                icon={copied ? <CheckCircleFilled /> : <CopyOutlined />}
                size={"small"}
              >
                {copied ? text?.copied : text?.copyToClipboard}
              </Button>
            </CopyToClipboard>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;
