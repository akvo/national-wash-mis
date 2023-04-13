import React, { useMemo, useEffect, useState } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Divider,
  Table,
  ConfigProvider,
  Checkbox,
  Empty,
  Space,
} from "antd";
import { api, store } from "../../lib";
import { Breadcrumbs } from "../../components";
import { reloadData } from "../../util/form";
import { useNotification } from "../../util/hooks";
import { getTranslation } from "../../util";

const pagePath = (text) => [
  {
    title: text.controlCenter,
    link: "/control-center",
  },
  {
    title: text.approvalsPath,
    link: "/approvals",
  },
  {
    title: text.title,
  },
];

const Questionnaires = () => {
  const { forms, user, language } = store.useState((s) => s);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "questionnaires");

  useEffect(() => {
    if (forms.length) {
      setDataset([...forms]);
    }
  }, [forms]);

  const columns = [
    {
      title: text.questCol,
      dataIndex: "name",
      key: "name",
    },
    {
      title: text.questDescCol,
      dataIndex: "description",
      render: (cell) => cell || <span>-</span>,
    },
    {
      title: text.nationalCol,
      render: (row) => (
        <Checkbox
          checked={row.type === 2}
          onChange={() => {
            handleChecked(row.id, 2);
          }}
        />
      ),
    },
    {
      title: text.countryCol,
      render: (row) => (
        <Checkbox
          checked={row.type === 1}
          onChange={() => {
            handleChecked(row.id, 1);
          }}
        />
      ),
    },
  ];

  const handleChecked = (id, val) => {
    const pos = dataset.findIndex((d) => d.id === id);
    if (pos !== -1) {
      const cloned = JSON.parse(JSON.stringify(dataset));
      cloned[pos].type = val;
      setDataset(cloned);
    }
  };

  const handleSubmit = () => {
    const data = dataset.map((d) => ({
      form_id: d.id,
      type: d.type,
    }));
    setLoading(true);
    api
      .post("form/type", data)
      .then(() => {
        setLoading(false);
        notify({
          type: "success",
          message: text.successUpdated,
        });
        reloadData(user, dataset);
      })
      .catch(() => {
        notify({
          type: "error",
          message: text.errorUpdated,
        });
        setLoading(false);
      });
  };

  const isPristine = useMemo(() => {
    return JSON.stringify(dataset) === JSON.stringify(forms);
  }, [dataset, forms]);

  return (
    <div id="questionnaires">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath(text)} />
        </Col>
        <Col>
          <Space size={6}>
            <Button
              className="light"
              disabled={isPristine}
              onClick={() => {
                const cloned = JSON.parse(JSON.stringify(forms));
                setDataset(cloned);
              }}
            >
              {text.reset}
            </Button>
            <Button
              type="primary"
              disabled={isPristine}
              onClick={handleSubmit}
              loading={loading}
            >
              {text.save}
            </Button>
          </Space>
        </Col>
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <ConfigProvider renderEmpty={() => <Empty description="No data" />}>
          <Table
            columns={columns}
            dataSource={dataset}
            loading={!dataset.length}
            pagination={false}
            rowKey="id"
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(Questionnaires);
