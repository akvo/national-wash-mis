import { Row, Col, Tag, Popover } from "antd";
import { Table } from "antd";
import {
  FileTextFilled,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

export const columnsSelected = (text) => [
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

export const columnsBatch = (text) => [
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

export const columnsPending = (text) => [
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
    render: (name) => (
      <Row align="middle">
        <Col>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{name}</div>
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
    title: text.submitterName,
    dataIndex: "submitter",
    key: "submitter",
    render: (submitter, dt) => {
      return submitter || dt.created_by;
    },
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
    title: text.duration,
    dataIndex: "duration",
    key: "duration",
    render: (duration) => duration || "",
    align: "center",
    width: 100,
  },
  Table.EXPAND_COLUMN,
];

export const columnsApprover = (text) => [
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
