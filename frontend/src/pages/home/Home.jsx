// import React, { useState, useEffect } from "react";
import React from "react";
import "./style.scss";
// import { Row, Col, Tabs, Image, Space, Button, Collapse } from "antd";
import { Row, Col, Image, Space, Button, Collapse } from "antd";
import { ContactForm, HomeAdministrationChart } from "../../components";

import { HomeMap } from "./components";
// import { queue, store } from "../../lib";
import { store } from "../../lib";
import { getTranslation } from "../../util";
// const { TabPane } = Tabs;

const partners = [
  {
    alt: "Government of the Netherlands",
    src: "gov-of-the-netherlands.png",
    width: 120,
  },
  {
    alt: "UNICEF",
    src: "unicef.png",
    width: 160,
  },
];
const { Panel } = Collapse;

export const Visuals = ({ current, mapValues, setMapValues, text }) => {
  return (
    <div>
      <div className="map-wrapper">
        {current?.maps?.form_id && (
          <HomeMap
            markerData={{ features: [] }}
            style={{ height: 532 }}
            current={current}
            mapValues={mapValues}
          />
        )}
      </div>
      <Collapse
        bordered={false}
        className="chart-collapse"
        style={{ display: "none" }}
      >
        <Panel header={text?.panelHeader} forceRender className="chart-panel">
          <div className="chart-wrapper">
            {current?.charts?.map(
              (hc, hcI) =>
                (hc.type === "ADMINISTRATION" || hc.type === "CRITERIA") && (
                  <HomeAdministrationChart
                    key={`chart-${hc.id}-${hcI}`}
                    formId={hc.form_id}
                    setup={hc}
                    index={hcI + 1}
                    setMapValues={setMapValues}
                    identifier={current?.name}
                  />
                )
            )}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

const Home = () => {
  // const { highlights } = window;
  // const [currentHighlight, setCurrentHighlight] = useState(highlights?.[0]);
  // const [mapValues, setMapValues] = useState([]);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "home");
  /*
  const onTabClick = (active) => {
    setCurrentHighlight(highlights.find((x) => x.name === active));
    queue.update((q) => {
      q.next = 1;
      q.wait = null;
    });
  };
  useEffect(() => {
    queue.update((q) => {
      q.next = 1;
      q.wait = null;
    });
  }, []);
  */

  return (
    <div id="home">
      <div className="home-odd about">
        <Row>
          <Col span={12} style={{ borderRight: "1px solid #888" }}>
            <h1>{text?.title}</h1>
            <p>{text?.description}</p>
          </Col>
          <Col span={12}>
            <h1>{text?.partners}</h1>
            <Row align="middle" justify="center" style={{ marginTop: "24px" }}>
              <Space size={50} align="center">
                {partners.map((p, px) => (
                  <Image
                    key={px}
                    alt={p.alt}
                    src={`/assets/partners/${p.src}`}
                    width={p.width}
                    preview={false}
                  />
                ))}
              </Space>
            </Row>
          </Col>
        </Row>
      </div>
      {/*
      <div className="home-even highlights">
        <div className="body" id="home-visualisation">
          <Tabs
            defaultActiveKey={highlights?.[0]?.name}
            onTabClick={onTabClick}
            centered
          >
            {highlights?.map((highlight) => (
              <TabPane tab={highlight.name} key={highlight.name}>
                <p className="highlight-title">{highlight.description}</p>
              </TabPane>
            ))}
          </Tabs>
          <Visuals
            current={currentHighlight}
            mapValues={mapValues}
            setMapValues={setMapValues}
            text={text}
          />
        </div>
      </div>
      */}
      <div className="home-even contact">
        <h1>{text?.contactUs}</h1>
        <Row align="middle" justify="center">
          <Space direction="vertical" align="center">
            <h3>{text?.getInTouch}</h3>
            <Button
              type="primary"
              onClick={() => {
                store.update((s) => {
                  s.showContactFormModal = true;
                });
              }}
            >
              {text?.sendFeedback}
            </Button>
          </Space>
        </Row>
      </div>
      <ContactForm />
    </div>
  );
};

export default React.memo(Home);
