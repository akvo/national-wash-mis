import React from "react";
import "./style.scss";
import { Button } from "antd";
import { store } from "../../lib";
import { useLocation } from "react-router-dom";
import { getTranslation } from "../../util";

const hideInPages = ["/control-center", "/data/submissions", "/profile"];

const RemoveFiltersButton = ({ extra = () => {} }) => {
  const { pathname } = useLocation();
  const hideButton = hideInPages.includes(pathname);
  if (hideButton) {
    return "";
  }
  const { active: activeLang } = store.useState((s) => s.language);
  const text = getTranslation(activeLang);
  return (
    <Button
      onClick={() => {
        store.update([
          (s) => {
            s.administration.length = 1;
            s.selectedAdministration = null;
            s.advancedFilters = [];
          },
          extra,
        ]);
      }}
      className="light"
    >
      {text.removeFilters}
    </Button>
  );
};

export default React.memo(RemoveFiltersButton);
