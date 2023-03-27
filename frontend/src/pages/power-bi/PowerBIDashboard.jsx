import React from "react";
import { Row, Col, Affix } from "antd";
import ResponsiveEmbed from "react-responsive-embed";
import "./style.scss";

const PowerBIDashboard = () => {
  return (
    <div id="powerbi-dashboard">
      <Affix className="sticky-wrapper">
        <div>
          <div className="page-title-wrapper">
            <h1>Household WASH Data</h1>
          </div>
        </div>
      </Affix>
      <Row className="main-wrapper" align="center">
        <Col span={24} align="center">
          <ResponsiveEmbed src="https://app.powerbi.com/view?r=eyJrIjoiMDk4ZTNhZDMtMTA0NS00MWJjLTgzMjctN2JhMDUyZmM2MzYwIiwidCI6ImIxNzBlMTE1LWRjM2QtNGU5Mi04NWJlLWU0YjMwMDljNWRjMiIsImMiOjl9" />
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(PowerBIDashboard);
