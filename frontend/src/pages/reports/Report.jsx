import React, { useEffect } from "react";
import "./style.scss";
import { Divider, Button, Row } from "antd";
import { config, store, queue } from "../../lib";
import {
  VisualisationFilters,
  DataChart,
  AdministrationChart,
} from "../../components";
import { useParams, Link } from "react-router-dom";
import IFrame from "./IFrame";
import { getTranslation } from "../../util";

const Reports = () => {
  const { selectedForm: formId, language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "report");

  const { templateId } = useParams();
  const template = config?.templates?.find((t) => t.id === +templateId);

  const handlePrint = () => {
    const print = document.getElementById("print-iframe");
    const title = "RUSH";
    print.contentDocument.title = title;
    print.focus();
    print.contentWindow.print();
  };

  useEffect(() => {
    if (formId) {
      queue.update((s) => {
        s.next = 1;
      });
    }
  }, [formId]);

  if (!template) {
    return <h3 className="text-muted">{text.templateNotFound}</h3>;
  }

  return (
    <div id="report">
      <VisualisationFilters persist={true} hidden={true} />
      <div className="report-header">
        <Row justify="space-between" align="middle">
          <div className="toolbar">
            <Button className="light mx" onClick={handlePrint}>
              {text.print}
            </Button>
            <Link to="/reports">
              <Button className="light">{text.back}</Button>
            </Link>
          </div>
        </Row>
      </div>
      {!!template?.charts?.length && (
        <IFrame className="print-frame">
          <div id="report">
            <div className="report-header" style={{ fontSize: 15 }}>
              <Row justify="space-between" align="middle">
                <h2>{template?.title}</h2>
              </Row>
              <h3>{template?.description}</h3>
            </div>
            {!!template?.charts?.length && (
              <div className="charts-wrap">
                {!!template?.chartListTitle && (
                  <Divider orientation="left" orientationMargin="0">
                    {template?.chartListTitle}
                  </Divider>
                )}
                {template?.charts?.map((cc, ccI) =>
                  cc.type === "ADMINISTRATION" || cc.type === "CRITERIA" ? (
                    <AdministrationChart
                      key={`chart-${template.id}-${ccI}`}
                      index={ccI + 1}
                      current={cc}
                    />
                  ) : (
                    <DataChart
                      key={`chart-${template.id}-${ccI}`}
                      index={ccI + 1}
                      current={cc}
                    />
                  )
                )}
              </div>
            )}
            {template?.footer && (
              <div className="report-footer">
                <h2>{template?.footer.title}</h2>
                <h4>{template?.footer.description}</h4>
              </div>
            )}
          </div>
        </IFrame>
      )}
    </div>
  );
};

export default React.memo(Reports);
