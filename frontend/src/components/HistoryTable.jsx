import React from "react";
import { Table } from "antd";
import { store } from "../lib";
import { getTranslation } from "../util";

const HistoryTable = ({ record }) => {
  const { history, id } = record;
  const { active: activeLang } = store.useState((s) => s.language);
  const text = getTranslation(activeLang, "historyTable");
  return (
    <div className="history-table-wrapper">
      <Table
        size="small"
        rowKey={`history-${id}-${Math.random}`}
        columns={[
          {
            title: text.history,
            dataIndex: "value",
            key: "value",
            ellipsis: true,
          },
          {
            title: text.updatedAt,
            dataIndex: "created",
            key: "created",
            align: "center",
            ellipsis: true,
          },
          {
            title: text.updatedBy,
            dataIndex: "created_by",
            key: "created_by",
            align: "center",
            ellipsis: true,
          },
        ]}
        loading={!history.length}
        pagination={false}
        dataSource={history}
      />
    </div>
  );
};

export default React.memo(HistoryTable);
