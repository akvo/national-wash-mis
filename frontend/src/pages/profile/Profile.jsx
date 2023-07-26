import React, { useMemo, useState } from "react";
import "./style.scss";
import { Space, Card, Divider, Row, Tag } from "antd";
import { store } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ProfileTour } from "./components";
import moment from "moment";
import { getTranslation } from "../../util";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

const Profile = () => {
  const [showPasscode, setShowPasscode] = useState(false);
  const { forms, user: authUser, language } = store.useState((s) => s);
  const { trained } = authUser;
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "profile");

  const trainedBadge = useMemo(() => {
    if (trained) {
      return (
        <Tag color="warning" style={{ marginBottom: 11 }}>
          {text.trained}
        </Tag>
      );
    }
  }, [trained, text.trained]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title:
        (
          <Space align="center" size={15}>
            {authUser?.name}
            {trainedBadge}
          </Space>
        ) || "Profile",
    },
  ];

  const fullAdministrationName = window.dbadm
    .find((x) => x.id === authUser.administration.id)
    ?.full_name?.split("|")
    .join(" - ");

  return (
    <div id="profile">
      <Row justify="space-between">
        <Breadcrumbs pagePath={pagePath} />
        <ProfileTour />
      </Row>
      <DescriptionPanel description={text.descriptionData} />
      <Divider />
      <Card style={{ padding: 0, marginBottom: 12 }}>
        <h1>{text.myProfile}</h1>
        <ul className="profile-detail">
          <li>
            <h3>{text.name}</h3>
            <Space size="large" align="center">
              <span>{authUser?.name}</span>
              <span style={{ fontStyle: "italic" }}>
                {authUser?.role?.value}
              </span>
            </Space>
          </li>
          <li>
            <h3>{text.phoneNumber}</h3>
            <Space size="large" align="center">
              <span>{authUser?.phone_number}</span>
            </Space>
          </li>
          <li>
            <h3>{text.role}</h3>
            <Space size="large" align="center">
              <span>{authUser?.role?.value}</span>
            </Space>
          </li>
          <li>
            <h3>{text?.organization}</h3>
            <Space size="large" align="center">
              <span>{authUser?.organisation?.name}</span>
            </Space>
          </li>
          <li>
            <h3>{text.designation}</h3>
            <Space size="large" align="center">
              <span>{authUser?.designation?.name}</span>
            </Space>
          </li>
          <li>
            <h3>{text.administration}</h3>
            <p>{fullAdministrationName || authUser?.administration?.name}</p>
          </li>
          <li>
            <h3>{text.questionnaires}</h3>
            <Space size="large" align="center">
              {forms.map((qi, qiI) => (
                <span key={qiI}>{qi.name}</span>
              ))}
            </Space>
          </li>
          <li>
            <h3>{text.formPasscode}</h3>
            <Space size="large" align="center">
              <span
                onClick={() => setShowPasscode(!showPasscode)}
                style={{ cursor: "pointer" }}
              >
                {showPasscode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
              <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                {authUser?.passcode
                  ? showPasscode
                    ? authUser.passcode
                    : "********"
                  : "-"}
              </span>
            </Space>
          </li>
          <li>
            <h3>{text.lastLogin}</h3>
            <Space size="large" align="center">
              <span>
                {authUser?.last_login
                  ? moment
                      .unix(authUser.last_login)
                      .format("MMMM Do YYYY, h:mm:ss a")
                  : "-"}
              </span>
            </Space>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default React.memo(Profile);
