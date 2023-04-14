import React, { useState } from "react";
import { Row, Col, Table, Button, Space, Divider, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { api, config, store } from "../../lib";
import { getTranslation } from "../../util";

const UserDetail = ({ record, setDeleteUser, deleting }) => {
  const { user, language } = store.useState((state) => state);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "userDetail");
  const [isFetchDeleteDetail, setIsFetchDeleteDetail] = useState(false);

  const handleOnClickDelete = () => {
    setIsFetchDeleteDetail(true);
    api.get(`user/${record.id}`).then((res) => {
      const { data } = res;
      const assosiations = [];
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (key === "pending_approval") {
          assosiations.push({
            name: text.pendingApproval,
            count: value,
          });
        }
        if (key === "pending_batch") {
          assosiations.push({
            name: text.pendingBatchSubmitted,
            count: value,
          });
        }
        if (key === "data") {
          assosiations.push({
            name: text.dataSubmission,
            count: value,
          });
        }
      });
      setDeleteUser({ ...record, assosiations: assosiations });
      setIsFetchDeleteDetail(false);
    });
  };

  const columns = (text) => [
    {
      title: text.fieldCol,
      dataIndex: "field",
      key: "field",
      width: "50%",
    },
    {
      title: text.valueCol,
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <>
      <Row justify="center" key="top">
        <Col span={20}>
          <Table
            columns={columns(text)}
            className="table-child"
            dataSource={[
              {
                key: "first_name",
                field: text.firstName,
                value: record?.first_name || "",
              },
              {
                key: "last_name",
                field: text.lastName,
                value: record?.last_name || "",
              },
              {
                key: "organisation",
                field: text.organisation,
                value: record?.organisation?.name || "-",
              },
              {
                key: "invite",
                field: text.invitationCode,
                value: (
                  <Link to={`/login/${record?.invite}`}>
                    <Button size="small">{text.changePassword}</Button>
                  </Link>
                ),
              },
              {
                key: "designation",
                field: text.designation,
                value: `${
                  config?.designations?.find(
                    (d) => d.id === parseInt(record.designation)
                  )?.name || "-"
                }`,
              },
              {
                key: "phone_number",
                field: text.phoneNumber,
                value: `${record?.phone_number || "-"}`,
              },
              {
                key: "forms",
                field: text.forms,
                value: `${
                  record.forms.length !== 0
                    ? record.forms.map((item) => item.name)
                    : record.forms.length === 1
                    ? record.forms.map((item) => item.name) + ", "
                    : "-"
                }`,
              },
            ]}
            pagination={false}
          />
        </Col>
        <Divider />
      </Row>
      <div>
        <Space>
          <Link to={`/user/${record.id}`}>
            <Button type="primary">{text.edit}</Button>
          </Link>
          {user && user.email === record.email ? (
            <Tooltip title={text.errorSelfDeletion}>
              <Button danger disabled>
                {text.delete}
              </Button>
            </Tooltip>
          ) : (
            <Button
              danger
              loading={deleting || isFetchDeleteDetail}
              onClick={handleOnClickDelete}
            >
              {text.delete}
            </Button>
          )}
        </Space>
      </div>
    </>
  );
};

export default UserDetail;
