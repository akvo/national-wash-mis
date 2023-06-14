import React from "react";
import { Breadcrumb, Typography } from "antd";
import { Link } from "react-router-dom";
import kebabCase from "lodash/kebabCase";
import "./style.scss";
import { formTrans, store } from "../../lib";
const { Title } = Typography;

const Breadcrumbs = ({ pagePath }) => {
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  if (pagePath.length < 1) {
    return "";
  }
  return (
    <Breadcrumb separator=">">
      {pagePath.map((path, pathIndex) => {
        const keyTrans = Object.keys(formTrans).find(
          (k) => k === kebabCase(path.title)
        );
        let pathTitle = path.title;
        if (
          !path.link &&
          formTrans[keyTrans] &&
          formTrans[keyTrans][activeLang]
        ) {
          pathTitle = formTrans[keyTrans][activeLang];
        }
        return (
          <Breadcrumb.Item key={pathIndex}>
            {path.link ? (
              <Link to={path.link}>
                <Title style={{ display: "inline" }} level={pathIndex + 1}>
                  {pathTitle}
                </Title>
              </Link>
            ) : (
              <Title style={{ display: "inline" }} level={pathIndex + 1}>
                {pathTitle}
              </Title>
            )}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
};

export default React.memo(Breadcrumbs);
