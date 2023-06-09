import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  ConfigProvider,
  Empty,
  Modal,
  Button,
  Space,
} from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import DataDetail from "./DataDetail";
import {
  DataFilters,
  Breadcrumbs,
  DescriptionPanel,
  DataTab,
} from "../../components";
import { useNotification } from "../../util/hooks";
import { generateAdvanceFilterURL } from "../../util/filter";
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
const ManageData = () => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [query, setQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateRecord, setUpdateRecord] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { language, advancedFilters } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "manageData");

  const { administration, selectedForm, questionGroups } = store.useState(
    (state) => state
  );

  const isAdministrationLoaded = administration.length;
  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const columns = [
    {
      title: text.nameCol,
      dataIndex: "name",
      key: "name",
      filtered: true,
      filteredValue: query.trim() === "" ? [] : [query],
      onFilter: (value, filters) =>
        filters.name.toLowerCase().includes(value.toLowerCase()),
      render: (value) => (
        <span className="with-icon">
          <ExclamationCircleOutlined />
          {value}
        </span>
      ),
    },
    {
      title: text.lastUpdatedCol,
      dataIndex: "updated",
      render: (cell, row) => cell || row.created,
    },
    {
      title: text.userCol,
      dataIndex: "created_by",
    },
    {
      title: text.regionCol,
      dataIndex: "administration",
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const handleDeleteData = () => {
    if (deleteData?.id) {
      setDeleting(true);
      api
        .delete(`data/${deleteData.id}`)
        .then(() => {
          notify({
            type: "success",
            message: `${deleteData.name} deleted`,
          });
          setDataset(dataset.filter((d) => d.id !== deleteData.id));
          setDeleteData(null);
        })
        .catch((err) => {
          notify({
            type: "error",
            message: text.errorDeleted,
          });
          console.error(err.response);
        })
        .finally(() => {
          setDeleting(false);
        });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAdministration]);

  useEffect(() => {
    if (selectedForm && isAdministrationLoaded && !updateRecord) {
      setLoading(true);
      let url = `/form-data/${selectedForm}/?page=${currentPage}`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
      }
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setUpdateRecord(null);
          setLoading(false);
        })
        .catch(() => {
          setDataset([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [
    selectedForm,
    selectedAdministration,
    currentPage,
    isAdministrationLoaded,
    updateRecord,
    advancedFilters,
  ]);

  return (
    <div id="manageData">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath(text)} />
          <DescriptionPanel
            description={
              <>
                {text.thisIsWhereYou}
                <ul>
                  <li>{text.manageDataCan1}</li>
                  <li>{text.manageDataCan2}</li>
                  <li>{text.manageDataCan3}</li>
                </ul>
              </>
            }
          />
        </Col>
      </Row>
      <DataTab />
      <DataFilters query={query} setQuery={setQuery} loading={loading} />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <ConfigProvider
          renderEmpty={() => (
            <Empty
              description={selectedForm ? text.noData : text.noFormSelected}
            />
          )}
        >
          <Table
            columns={columns}
            dataSource={dataset}
            loading={loading}
            onChange={handleChange}
            pagination={{
              current: currentPage,
              total: totalCount,
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `Results: ${range[0]} - ${range[1]} of ${total} data`,
            }}
            rowKey="id"
            expandable={{
              expandedRowRender: (record) => (
                <DataDetail
                  questionGroups={questionGroups}
                  record={record}
                  updateRecord={updateRecord}
                  updater={setUpdateRecord}
                  setDeleteData={setDeleteData}
                />
              ),
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
        </ConfigProvider>
      </Card>
      <Modal
        visible={deleteData}
        onCancel={() => setDeleteData(null)}
        centered
        width="575px"
        footer={
          <Row justify="center" align="middle">
            <Col span={14}>&nbsp;</Col>
            <Col span={10}>
              <Button
                className="light"
                disabled={deleting}
                onClick={() => {
                  setDeleteData(null);
                }}
              >
                {text.cancel}
              </Button>
              <Button
                type="primary"
                danger
                loading={deleting}
                onClick={handleDeleteData}
              >
                {text.delete}
              </Button>
            </Col>
          </Row>
        }
        bodyStyle={{ textAlign: "center" }}
      >
        <Space direction="vertical">
          <DeleteOutlined style={{ fontSize: "50px" }} />
          <p>
            {text?.confirmDelete1?.replace(":name:", deleteData?.name)}
            <b>{text.confirmDelete2}</b>.{text.confirmDelete3}
          </p>
        </Space>
      </Modal>
    </div>
  );
};

export default React.memo(ManageData);
