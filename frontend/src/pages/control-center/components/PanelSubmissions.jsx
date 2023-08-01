import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Tabs,
  Row,
  Button,
  Col,
  Checkbox,
  Modal,
  Tag,
  Popover,
} from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  FileTextFilled,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { DataFilters } from "../../../components";
import { api, store } from "../../../lib";
import { Link } from "react-router-dom";
import { useNotification } from "../../../util/hooks";
import { isEmpty, without, union, xor } from "lodash";
import { getTranslation } from "../../../util";

const { TabPane } = Tabs;
const { TextArea } = Input;

const columnsSelected = (text) => [
  {
    title: text.selectedDatasetCol,
    dataIndex: "name",
    key: "name",
  },
  {
    title: text.selectedDateCol,
    dataIndex: "created",
    key: "created",
    align: "right",
  },
];

const columnsBatch = (text) => [
  {
    title: "",
    dataIndex: "id",
    key: "id",
    align: "center",
    render: () => <InfoCircleOutlined />,
    width: 50,
  },
  {
    title: text.batchNameCol,
    dataIndex: "name",
    key: "name",
    render: (name, row) => (
      <Row align="middle">
        <Col>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{name}</div>
          <div>{row.created}</div>
        </Col>
      </Row>
    ),
  },
  {
    title: text.batchFormCol,
    dataIndex: "form",
    key: "form",
    render: (form) => form.name || "",
  },
  {
    title: text.batchAdmCol,
    dataIndex: "administration",
    key: "administration",
    render: (administration) => administration.name || "",
  },
  {
    title: text.batchStatusCol,
    dataIndex: "approvers",
    key: "approvers",
    align: "center",
    render: (approvers) => {
      if (approvers?.length) {
        const status_text = approvers[approvers.length - 1].status_text;
        return (
          <span>
            <Tag
              icon={
                status_text === "Pending" ? (
                  <ClockCircleOutlined />
                ) : status_text === "Rejected" ? (
                  <CloseCircleOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              color={
                status_text === "Pending"
                  ? "default"
                  : status_text === "Rejected"
                  ? "error"
                  : "success"
              }
            >
              {status_text}
            </Tag>
          </span>
        );
      }
      return (
        <span>
          <Popover content={text.batchPopContent} title={text.batchPopTitle}>
            <Tag color="warning" icon={<ExclamationCircleOutlined />}>
              {text.batchPopTitle}
            </Tag>
          </Popover>
        </span>
      );
    },
  },
  {
    title: text.batchTotalCol,
    dataIndex: "total_data",
    key: "total_data",
    align: "center",
  },
];

const columnsPending = (text) => [
  {
    title: "",
    dataIndex: "id",
    key: "id",
    render: () => <InfoCircleOutlined />,
    width: 50,
  },
  {
    title: text.pendingNameCol,
    dataIndex: "name",
    key: "name",
    render: (name, row) => (
      <Row align="middle">
        <Col>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{name}</div>
          <div>{row.created}</div>
        </Col>
      </Row>
    ),
  },
  {
    title: text.pendingAdmCol,
    dataIndex: "administration",
    key: "administration",
  },
  {
    title: text.submittedDate,
    dataIndex: "created",
    key: "created",
    render: (created) => created || "",
    align: "center",
    width: 200,
  },
  {
    title: text.submitterName,
    dataIndex: "submitter",
    key: "submitter",
    render: (submitter, dt) => {
      return submitter || dt.created_by;
    },
  },
  {
    title: text.duration,
    dataIndex: "duration",
    key: "duration",
    render: (duration) => duration || "",
    align: "center",
    width: 100,
  },
  Table.EXPAND_COLUMN,
];

const columnsApprover = (text) => [
  {
    title: text.approverNameCol,
    dataIndex: "name",
    key: "name",
  },
  {
    title: text.approverAdmCol,
    dataIndex: "administration",
    key: "administration",
  },
  {
    title: text.approverStatusCol,
    dataIndex: "status_text",
    key: "status_text",
    render: (status_text) => (
      <span>
        <Tag
          icon={
            status_text === "Pending" ? (
              <ClockCircleOutlined />
            ) : status_text === "Rejected" ? (
              <CloseCircleOutlined />
            ) : (
              <CheckCircleOutlined />
            )
          }
          color={
            status_text === "Pending"
              ? "default"
              : status_text === "Rejected"
              ? "error"
              : "success"
          }
        >
          {status_text}
        </Tag>
      </span>
    ),
  },
];

const ApproverDetail = (record, text) => {
  return (
    <Table
      columns={columnsApprover(text)}
      dataSource={record.approvers.map((r, ri) => ({
        key: ri,
        ...r,
      }))}
      pagination={false}
    />
  );
};

const PanelSubmissions = () => {
  const [dataset, setDataset] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending-data");
  const [batchName, setBatchName] = useState("");
  const [modalButton, setModalButton] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "controlCenter");

  const { notify } = useNotification();
  const { selectedForm, user } = store.useState((state) => state);

  useEffect(() => {
    let url = `form-pending-data/${selectedForm}/?page=${currentPage}`;
    if (selectedTab === "pending-data") {
      setExpandedKeys([]);
      setModalButton(true);
    }
    if (selectedTab === "pending-batch") {
      url = `batch/?page=${currentPage}`;
      setModalButton(false);
    }
    if (selectedTab === "approved-batch") {
      url = `batch/?page=${currentPage}&approved=true`;
      setModalButton(false);
    }
    if (
      selectedTab === "pending-batch" ||
      selectedTab === "approved-batch" ||
      selectedForm
    ) {
      setLoading(true);
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch(() => {
          setDataset([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [selectedTab, selectedForm, currentPage]);

  useEffect(() => {
    if (selectedForm) {
      setSelectedRows([]);
      setSelectedRowKeys([]);
    }
  }, [selectedForm]);

  useEffect(() => {
    if (selectedTab) {
      setDataset([]);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (dataset.length) {
      const selectedDataset = selectedRowKeys.map((s) => {
        const findData = dataset.find((d) => d.id === s);
        return findData;
      });
      setSelectedRows(selectedDataset);
    }
  }, [dataset, selectedRowKeys]);

  const handlePageChange = (e) => {
    setCurrentPage(e.current);
  };

  const sendBatch = () => {
    setLoading(true);
    const payload = { name: batchName, data: selectedRows.map((x) => x.id) };
    api
      .post(
        "batch",
        comment.length ? { ...payload, comment: comment } : payload
      )
      .then(() => {
        setSelectedRows([]);
        setSelectedRowKeys([]);
        setModalVisible(false);
        setLoading(false);
        setSelectedTab("pending-batch");
      })
      .catch(() => {
        setLoading(false);
        setModalVisible(false);
      });
  };

  const hasSelected = !isEmpty(selectedRowKeys);
  const onSelectTableRow = (val) => {
    const { id } = val;
    selectedRowKeys.includes(id)
      ? setSelectedRowKeys(without(selectedRowKeys, id))
      : setSelectedRowKeys([...selectedRowKeys, id]);
  };

  const onSelectAllTableRow = (isSelected) => {
    const ids = dataset.filter((x) => !x?.disabled).map((x) => x.id);
    if (!isSelected && hasSelected) {
      setSelectedRowKeys(xor(selectedRowKeys, ids));
    }
    if (isSelected && !hasSelected) {
      setSelectedRowKeys(ids);
    }
    if (isSelected && hasSelected) {
      setSelectedRowKeys(union(selectedRowKeys, ids));
    }
  };

  const btnBatchSelected = useMemo(() => {
    const handleOnClickBatchSelectedDataset = () => {
      // check only for data entry role
      if (user.role.id === 4) {
        api.get(`form/check-approver/${selectedForm}`).then((res) => {
          if (!res.data.count) {
            notify({
              type: "error",
              message: text.batchNoApproverMessage,
            });
          } else {
            setModalVisible(true);
          }
        });
      } else {
        setModalVisible(true);
      }
    };
    if (!!selectedRows.length && modalButton) {
      return (
        <Button type="primary" onClick={handleOnClickBatchSelectedDataset}>
          {text.batchSelectedDatasets}
        </Button>
      );
    }
    return "";
  }, [
    selectedRows,
    modalButton,
    text.batchSelectedDatasets,
    notify,
    selectedForm,
    text.batchNoApproverMessage,
    user.role.id,
  ]);

  const DataTable = ({ pane }) => {
    return (
      <Table
        loading={loading}
        dataSource={dataset}
        columns={
          pane === "pending-data"
            ? [...columnsPending(text)]
            : [...columnsBatch(text), Table.EXPAND_COLUMN]
        }
        onChange={handlePageChange}
        rowSelection={
          pane === "pending-data"
            ? {
                selectedRowKeys: selectedRowKeys,
                onSelect: onSelectTableRow,
                onSelectAll: onSelectAllTableRow,
                getCheckboxProps: (record) => ({
                  disabled: record?.disabled,
                }),
              }
            : false
        }
        pagination={{
          current: currentPage,
          total: totalCount,
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total, range) =>
            `Results: ${range[0]} - ${range[1]} of ${total} data`,
        }}
        rowKey="id"
        expandedRowKeys={expandedKeys}
        expandable={
          pane === "pending-data"
            ? false
            : {
                expandedRowRender: (record) => ApproverDetail(record, text),
                expandIcon: (expand) => {
                  return expand.expanded ? (
                    <CloseSquareOutlined
                      onClick={() => setExpandedKeys([])}
                      style={{ color: "#e94b4c" }}
                    />
                  ) : (
                    <PlusSquareOutlined
                      onClick={() => setExpandedKeys([expand.record.id])}
                      style={{ color: "#7d7d7d" }}
                    />
                  );
                },
              }
        }
      />
    );
  };

  return (
    <>
      <Card id="panel-submission">
        <h1 className="submission">Submissions</h1>
        <DataFilters />
        <Tabs
          activeKey={selectedTab}
          defaultActiveKey={selectedTab}
          onChange={setSelectedTab}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab={text.uploadsTab1} key={"pending-data"}>
            <DataTable pane="pending-data" />
          </TabPane>
          <TabPane tab={text.uploadsTab2} key={"pending-batch"}>
            <DataTable pane="pending-batch" />
          </TabPane>
          <TabPane tab={text.uploadsTab3} key={"approved-batch"}>
            <DataTable pane="approved-batch" />
          </TabPane>
        </Tabs>
        <Link to="/data/submissions">
          <Button className="view-all" type="primary">
            {text.viewAll}
          </Button>
        </Link>
      </Card>
      <Modal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        footer={
          <Row align="middle">
            <Col xs={24} align="left">
              <div className="batch-name-field">
                <label>{text.batchName}</label>
                <Input
                  onChange={(e) => setBatchName(e.target.value)}
                  allowClear
                />
              </div>
              <label>{text.submissionComment}</label>
              <TextArea rows={4} onChange={(e) => setComment(e.target.value)} />
            </Col>
            <Col xs={12} align="left">
              <Checkbox checked={true} disabled={true} className="dev">
                {text.sendNewRequest}
              </Checkbox>
            </Col>
            <Col xs={12}>
              <Button
                className="light"
                onClick={() => {
                  setModalVisible(false);
                }}
              >
                {text.cancel}
              </Button>
              <Button
                type="primary"
                onClick={sendBatch}
                disabled={!batchName.length}
              >
                {text.createNewBatch}
              </Button>
            </Col>
          </Row>
        }
      >
        <p>{text.batchHintText}</p>
        <p>
          <FileTextFilled style={{ color: "#666666", fontSize: 64 }} />
        </p>
        <p>{text.batchHintDesc}</p>
        <Table
          bordered
          size="small"
          dataSource={selectedRows}
          columns={columnsSelected(text)}
          pagination={false}
          scroll={{ y: 270 }}
          rowKey="id"
        />
      </Modal>
    </>
  );
};

export default PanelSubmissions;
