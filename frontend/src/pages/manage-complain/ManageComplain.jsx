import React, { useState, useEffect, useCallback } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Table } from "antd";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import moment from "moment";

import ComplainDetail from "./ComplainDetail";
import { api, store } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";
import { getTranslation } from "../../util";

const pagePath = (text) => [
  {
    title: text.controlCenter,
    link: "/control-center",
  },
  {
    title: text.pageTitle,
  },
];

const ManageComplain = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "complains");

  const { isLoggedIn } = store.useState((state) => state);
  const { notify } = useNotification();

  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, record, index) => index + 1,
    },
    {
      title: text.geoCol,
      dataIndex: "geo",
      key: "geo",
    },
    {
      title: text.phoneCol,
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: text.createdCol,
      dataIndex: "created",
      key: "created",
      render: (created) =>
        created
          ? moment(created, "DD-MM-YYYY HH:mm:ss").format(
              "HH:mm:ss MMMM Do YYYY"
            )
          : "-",
    },
    Table.EXPAND_COLUMN,
  ];
  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const fetchData = useCallback(() => {
    if (isLoggedIn) {
      const url = `data?page=${currentPage}`;
      setLoading(true);
      api
        .get(url, { baseURL: "/api/gateway/" })
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch((err) => {
          notify({
            type: "error",
            message: text.complainsLoadFail,
          });
          setLoading(false);
          console.error(err);
        });
    }
  }, [currentPage, isLoggedIn, notify, text.complainsLoadFail]);

  useEffect(() => {
    fetchData();
  }, [currentPage, isLoggedIn, notify, fetchData]);

  return (
    <div id="complains">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath(text)} />
          <DescriptionPanel
            description={
              <>
                {text.thisIsWhereYou}
                <ul>
                  <li>{text.manageComplainCan1}</li>
                </ul>
              </>
            }
          />
        </Col>
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          rowClassName={() => "editable-row"}
          dataSource={dataset}
          loading={loading}
          onChange={handleChange}
          pagination={{
            showSizeChanger: false,
            current: currentPage,
            total: totalCount,
            pageSize: 10,
            showTotal: (total, range) =>
              `Results: ${range[0]} - ${range[1]} of ${total} complains`,
          }}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => <ComplainDetail record={record} />,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <CloseSquareOutlined
                  onClick={(e) => onExpand(record, e)}
                  style={{ color: "#e94b4c" }}
                />
              ) : (
                <PlusSquareOutlined
                  onClick={(e) => onExpand(record, e)}
                  style={{ color: "#7d7d7d" }}
                />
              ),
          }}
        />
      </Card>
    </div>
  );
};

export default ManageComplain;
