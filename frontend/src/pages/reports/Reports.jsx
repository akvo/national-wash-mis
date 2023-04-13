import React from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { store, config } from "../../lib";
import { VisualisationFilters } from "../../components";
import { Link } from "react-router-dom";
import { getTranslation } from "../../util";

const Reports = () => {
  const { selectedForm, language } = store.useState((state) => state);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "report");
  const filtered = config?.templates.filter((t) => t.formId === selectedForm);

  return (
    <div id="reports">
      <VisualisationFilters persist={true} />
      <h2>{text.chooseTemplate}</h2>
      {filtered.length ? (
        <Row gutter={[16, 16]}>
          {filtered.map((t, tI) => (
            <Col span={12} key={tI}>
              <Card>
                <h3>{t.name}</h3>
                <h4>{t.title}</h4>
                <Link to={`/report/${t.id}`}>
                  <Button type="primary">{text.select}</Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p className="text-muted">{text.noTemplateFound}</p>
      )}
    </div>
  );
};

export default React.memo(Reports);
