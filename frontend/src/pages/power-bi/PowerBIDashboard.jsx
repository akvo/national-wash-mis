import React from "react";
import { Affix } from "antd";
import ResponsiveEmbed from "react-responsive-embed";
import { useParams } from "react-router-dom";
import "./style.scss";

const PowerBIDashboard = () => {
  const { formId } = useParams();
  const current =
    window?.powerBIDashboard?.find((x) => (x.form_id = formId)) || null;

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
