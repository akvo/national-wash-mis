import React from "react";
import "./style.scss";
import { Button } from "antd";
import { store } from "../../lib";
import { FilterOutlined } from "@ant-design/icons";
import { getTranslation } from "../../util";

const AdvancedFiltersButton = () => {
  const { advancedFilters, showAdvancedFilters, language } = store.useState(
    (s) => s
  );
  const { active: activeLang } = language;
  const text = getTranslation(activeLang);
  return (
    <Button
      onClick={() => {
        store.update((s) => {
          s.showAdvancedFilters = !showAdvancedFilters;
        });
      }}
      icon={<FilterOutlined />}
      className={
        showAdvancedFilters || advancedFilters.length ? "light active" : "light"
      }
    >
      {text.advancedFilters}
    </Button>
  );
};

export default React.memo(AdvancedFiltersButton);
