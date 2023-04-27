import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Space, Button, Menu, Dropdown } from "antd";
import { UserOutlined, CaretDownOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { config, store } from "../../lib";
import { eraseCookieFromAllPaths } from "../../util/date";
import { getTranslation } from "../../util";

const Header = ({ className = "header", ...props }) => {
  const { isLoggedIn, user } = store.useState();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = store.useState((s) => s);
  const { active: activeLang, langs: languages } = language;
  const text = getTranslation(activeLang, "header");
  // const dashboards = window?.dashboard;
  const powerBIDashboard = window?.powerBIDashboard;
  // const reports = window?.reports;

  const signOut = async () => {
    eraseCookieFromAllPaths("AUTH_TOKEN");
    store.update((s) => {
      s.isLoggedIn = false;
      s.user = null;
    });
    navigate("login");
  };

  const handleLangClick = ({ key }) => {
    store.update((s) => {
      s.language = {
        ...s.language,
        active: key,
      };
    });
  };

  const userMenu = (
    <Menu>
      {config.checkAccess(user?.role_detail, "control-center") && (
        <Menu.Item key="controlCenter">
          <Link to="/control-center">{text?.controlCenter}</Link>
        </Menu.Item>
      )}
      <Menu.Item key="profile">
        <Link to="/profile">{text?.myProfile}</Link>
      </Menu.Item>
      <Menu.Item key="signOut" danger>
        <a
          onClick={() => {
            signOut();
          }}
        >
          {text?.signOut}
        </a>
      </Menu.Item>
    </Menu>
  );

  /*
  const DashboardMenu = (
    <Menu>
      {dashboards?.map((d) => (
        <Menu.Item key={`${d.name}`} className="dashboard-menu-item">
          <Link to={`/${d.page}/${d.form_id}`}>{d.name}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  const ReportsMenu = (
    <Menu>
      {reports?.map((d) => (
        <Menu.Item key={`${d.name}`} className="dashboard-menu-item">
          <Link to={`/${d.page}/${d.form_id}`}>{d.name}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );
  */
  const PowerBIMenu = (
    <Menu>
      {powerBIDashboard?.map((d) => (
        <Menu.Item key={`${d.name}`} className="dashboard-menu-item">
          <Link to={`/${d.page}/${d.form_id}`}>{d.name}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  const langMenu = (
    <Menu onClick={handleLangClick}>
      {Object.keys(languages)?.map((lg) => (
        <Menu.Item key={lg} className="dashboard-menu-item">
          {languages[lg] || lg}
        </Menu.Item>
      ))}
    </Menu>
  );

  if (
    location.pathname.includes("/login") ||
    location.pathname.includes("/forgot-password")
  ) {
    return "";
  }

  return (
    <Row
      className={className}
      align="middle"
      justify="space-between"
      {...props}
    >
      <Col>
        <div className="logo">
          <Link to="/">
            <img
              className="small-logo"
              src={config.siteLogo}
              alt={config.siteLogo}
            />
            <h1>
              {config.siteTitle}
              <small>{config.siteSubTitle}</small>
            </h1>
          </Link>
        </div>
      </Col>
      {!location.pathname.includes("/report/") && (
        <Col>
          <div className="navigation">
            <Space>
              {/* old dashboard */}
              {/* <Link to="/data/visualisation">{text?.dashboards}</Link> */}
              <Link className="dev" to="/reports">
                {text?.reports}
              </Link>
              {/* Experimental Dashboard */}
              <Dropdown overlay={PowerBIMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {text?.newDashboard}
                </a>
              </Dropdown>

              {/* Experimental Dashboard
              <Dropdown overlay={DashboardMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {text?.dashboards}
                </a>
              </Dropdown>
              <Dropdown overlay={ReportsMenu}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {text?.reports}
                </a>
              </Dropdown>
              */}
              {/* <a className="dev">Monitoring</a> */}
              {/* <Link className="dev" to="/how-we-work">
              How We Work
            </Link> */}
              <Link className="dev" to="/news-events">
                {text?.newsEvents}
              </Link>
            </Space>
          </div>
          <Space>
            <div className="account">
              {isLoggedIn ? (
                <Dropdown overlay={userMenu}>
                  <a
                    className="ant-dropdown-link"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    {user?.name || ""}
                    <span className="role">, {user?.role?.value || ""}</span>
                    <span className="icon">
                      <UserOutlined />
                    </span>
                  </a>
                </Dropdown>
              ) : (
                <Link to={"/login"}>
                  <Button type="primary" size="small">
                    {text?.login}
                  </Button>
                </Link>
              )}
            </div>
            <Dropdown overlay={langMenu} placement="bottomRight">
              <Button
                type="secondary"
                size="small"
                className="language-switcher"
              >
                {activeLang}
                <CaretDownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </Col>
      )}
    </Row>
  );
};

Header.propTypes = {
  className: PropTypes.string,
};

export default Header;
