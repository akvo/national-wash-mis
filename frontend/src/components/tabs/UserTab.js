import React from "react";
import { Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { store } from "../../lib";
import { getTranslation } from "../../util";

const { TabPane } = Tabs;

const UserTab = ({ tabBarExtraContent }) => {
  const pathname = window.location.pathname;
  const navigate = useNavigate();
  const { active: activeLang } = store.useState((s) => s.language);
  const text = getTranslation(activeLang, "tabs");
  return (
    <Tabs
      size="large"
      activeKey={pathname}
      onChange={(key) => navigate(key)}
      tabBarExtraContent={tabBarExtraContent}
    >
      <TabPane tab={text.manageUsers} key="/users">
        &nbsp;
      </TabPane>
      <TabPane tab={text.dataValidationTree} key="/approvers/tree">
        &nbsp;
      </TabPane>
    </Tabs>
  );
};

export default UserTab;
