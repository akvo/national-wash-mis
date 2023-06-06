import React from "react";
import { Row, Col, Button, Dropdown, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import ComingSoon from "./custom/ComingSoon";
import { store } from "../../lib";
import { getTranslation } from "../../util";

const styles = {
  banner: {
    backgroundImage: `url("/assets/banner.jpg")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
};

const Banner = () => {
  const { pathname } = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "layout");

  if (
    pathname !== "/" &&
    pathname !== "/not-found" &&
    pathname !== "/coming-soon"
  ) {
    return "";
  }

  const HomeBanner = () => {
    const scrollToView = () => {
      const section = document.querySelector("#home-visualisation");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const DashboardMenu = (
      <Menu>
        {window?.powerBIDashboard?.map((d) => (
          <Menu.Item
            key={`${d.name}`}
            style={{ fontSize: 16, fontStyle: "italic", padding: 10 }}
          >
            <Link to={`/${d.page}/${d.form_id}`}>{d.name}</Link>
          </Menu.Item>
        ))}
      </Menu>
    );
    return (
      <>
        <h1>
          {text?.bannerTitle1}
          <br />
          {text?.bannerTitle2}
        </h1>
        <h2>
          {text?.bannerSubT1}
          <br />
          {text?.bannerSubT2}
        </h2>
        <Row>
          <Button
            size="large"
            onClick={() => scrollToView()}
            className="btn-explore-national-data"
          >
            {text?.welcomeCta}
          </Button>
          <Dropdown overlay={DashboardMenu}>
            <Button
              size="large"
              onClick={(e) => e.preventDefault()}
              className="btn-dashboard"
            >
              {text?.dashboardButton} <DownOutlined />
            </Button>
          </Dropdown>
        </Row>
      </>
    );
  };

  const ErrorBanner = ({ status, message, description }) => {
    return (
      <>
        <h1>
          {text?.error} {status}
          <br />
          <small>
            {message ||
              (status === 404
                ? text?.errorPageNA
                : status === 401
                ? text?.errorAuth
                : text?.errorUnknown)}
            <br />
            {description ||
              (status === 404
                ? text?.errorURL
                : status === 401
                ? text?.errorVerifyCreds
                : "")}
          </small>
        </h1>
        <Link to="/">
          <Button size="large">{text?.backHome}</Button>
        </Link>
      </>
    );
  };

  const ComingSoonBanner = () => {
    return (
      <>
        <h1>{text?.welcome}</h1>
        <ComingSoon />
      </>
    );
  };

  return (
    <div style={styles.banner}>
      <Row className="banner" align="middle">
        <Col span={20}>
          {pathname === "/not-found" ? (
            <ErrorBanner status={404} />
          ) : pathname === "/coming-soon" ? (
            <ComingSoonBanner />
          ) : (
            <HomeBanner />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Banner;
