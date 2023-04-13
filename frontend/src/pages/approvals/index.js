import { Row, Col, Tag } from "antd";
import {
  FileTextFilled,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export const columnsApproval = (text) => [
  {
    title: "",
    dataIndex: "id",
    key: "id",
    width: "40px",
    render: () => <InfoCircleOutlined />,
  },
  {
    title: text?.submissionCol,
    dataIndex: "name",
    key: "name",
    width: "20%",
    render: (filename) => (
      <Row>
        <Col span={4}>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col span={12}>{filename}</Col>
      </Row>
    ),
  },
  {
    title: text?.formCol,
    dataIndex: "form",
    key: "form",
    render: (form) => form.name,
  },
  {
    title: text?.dateCol,
    dataIndex: "created",
    key: "created",
  },
  {
    title: text?.submitterCol,
    dataIndex: "created_by",
    key: "created_by",
  },
  {
    title: text?.locationCol,
    dataIndex: "administration",
    key: "administration",
    render: (administration) => administration.name,
  },
  {
    title: text?.statusCol,
    dataIndex: "approver",
    key: "approver",
    render: ({ status_text }) => (
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
  {
    title: text?.waitingOnCol,
    dataIndex: "waiting_on",
    key: "waiting_on",
    render: (_, row) => row.approver.name,
  },
  {
    title: text?.totalDataCol,
    dataIndex: "total_data",
    key: "total_data",
  },
];
