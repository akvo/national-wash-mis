import React from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { store, config } from "../../lib";
import { Link } from "react-router-dom";
import { PanelApprovals } from "../profile/components";

const panels = [
  {
    title: "Manage Data",
    buttonLabel: "Manage Data",
    access: "data",
    description:
      "Open defecation free (ODF) is a term used to describe communities that have shifted to using toilets instead of open defecation. This can happen, for example, after community-led total sanitation programs have been implemented.",
    link: "/data/manage",
    image: require("../../assets/big-data.png"),
  },
  {
    title: "Exports",
    buttonLabel: "Data Exports",
    access: "data",
    description:
      "Community-led total sanitation (CLTS) is an approach used mainly in developing countries to improve sanitation and hygiene practices in a community. The approach tries to achieve behavior change in mainly rural people by a process of “triggering”, leading to spontaneous and long-term abandonment of open defecation practices.",
    link: "/data/export",
    image: require("../../assets/import.png"),
    dev: true,
  },
  {
    title: "Data Uploads",
    buttonLabel: "Data Uploads",
    access: "form",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/data/upload",
    image: require("../../assets/upload.png"),
    dev: true,
  },
  {
    title: "User Management",
    buttonLabel: "Manage Users",
    access: "user",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/users",
    image: require("../../assets/personal-information.png"),
  },
];

const ControlCenter = () => {
  const { user: authUser } = store.useState((s) => s);
  const selectedPanels = panels.filter((p) =>
    config.checkAccess(authUser?.role_detail, p.access)
  );
  return (
    <div id="control-center">
      <h1>Control Center</h1>
      <Row gutter={[16, 16]}>
        {selectedPanels.map((panel, index) => (
          <Col className="card-wrapper" span={12} key={index}>
            <Card bordered={false} hoverable>
              <div className="row">
                <div className="flex-1">
                  <h2>{panel.title}</h2>
                  <p>{panel.description}</p>
                  <Link to={panel.link} className="explore">
                    <Button
                      type={panel.dev ? "default" : "primary"}
                      className={panel?.dev ? "dev" : ""}
                    >
                      {panel.buttonLabel}
                    </Button>
                  </Link>
                </div>
                <div>
                  <img src={panel.image} width={100} height={100} />
                </div>
              </div>
            </Card>
          </Col>
        ))}
        <Col span={24}>
          <PanelApprovals />
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(ControlCenter);
