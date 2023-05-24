import React, { useCallback, useEffect, useState } from "react";
import { Table, Space, Spin, Image } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import { getTranslation } from "../../util";

const twilioMediaRegex = /^https:\/\/api\.twilio\.com\//;

const ComplainDetail = ({ record }) => {
  const [dataset, setDataset] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { language } = store.useState((state) => state);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "complains");

  const fetchComplain = useCallback((id) => {
    setLoading(true);
    api
      .get(`data/${id}/`, { baseURL: "/api/gateway/" })
      .then(({ data }) => {
        const { answers: dataAnswers, ...dataComplain } = data;
        setAnswers(dataAnswers);
        setDataset(dataComplain);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if ((record?.id && !dataset) || (dataset && record?.id !== dataset.id)) {
      fetchComplain(record.id);
    }
  }, [record, dataset, fetchComplain]);

  return loading ? (
    <Space style={{ paddingTop: 18, color: "#9e9e9e" }} size="middle">
      <Spin indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />} />
      <span>{text.loading}..</span>
    </Space>
  ) : (
    <div id="manageData">
      <div className="data-detail">
        <h3>{text.answerDetails}</h3>
        <Table
          pagination={false}
          dataSource={answers}
          rowClassName="row-normal"
          rowKey="id"
          columns={[
            {
              title: text.questionCol,
              dataIndex: "question_text",
            },
            {
              title: text.valueCol,
              dataIndex: "value",
              render: (val, record) => {
                if (
                  twilioMediaRegex.test(val) ||
                  record?.question_type?.toLowerCase() === "photo"
                ) {
                  return (
                    <div>
                      <Image src={val} preview={false} />
                    </div>
                  );
                }
                return val;
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default React.memo(ComplainDetail);
