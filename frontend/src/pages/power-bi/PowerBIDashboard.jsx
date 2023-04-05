import React from "react";
import { Row, Col, Affix } from "antd";
import ResponsiveEmbed from "react-responsive-embed";
import "./style.scss";

const PowerBIDashboard = () => {
  const form_id = 1;
  const current =
    window?.powerBIDashboard?.find((x) => (x.form_id = form_id)) || null;

  if (!current || !current?.content) {
    return "";
  }

  return (
    <div id="powerbi-dashboard">
      {current.content.map((c, ci) => {
        const componentKey = `${c.key}-${ci}`;
        console.log(c);
        switch (c.key) {
          case "embed":
            return (
              <div
                key={componentKey}
                className="main-wrapper"
                style={c?.style ? c.style : {}}
              >
                <ResponsiveEmbed src={c.link} />
              </div>
            );
          default:
            return (
              <Affix key={componentKey} className="sticky-wrapper">
                <div className="page-title-wrapper">
                  <h1 style={c?.style ? c.style : {}}>{c.text}</h1>
                </div>
              </Affix>
            );
        }
      })}
    </div>
  );
};

export default React.memo(PowerBIDashboard);
