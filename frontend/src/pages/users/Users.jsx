import React, { useState, useEffect, useCallback } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Divider, Table, Modal, Tag } from "antd";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import UserDetail from "./UserDetail";
import {
  UserFilters,
  Breadcrumbs,
  DescriptionPanel,
  UserTab,
} from "../../components";
import { useNotification } from "../../util/hooks";
import { reverse } from "lodash";
import moment from "moment";
import { getTranslation } from "../../util";

const pagePath = (text) => [
  {
    title: text.controlCenter,
    link: "/control-center",
  },
  {
    title: text.manageUsers,
  },
];
const Users = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "users");

  const { administration, filters, isLoggedIn } = store.useState(
    (state) => state
  );
  const { trained, role, organisation } = filters;
  const { notify } = useNotification();

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const columns = [
    {
      title: text.name,
      dataIndex: "first_name",
      key: "first_name",
      render: (firstName, row) => (
        <span>
          {firstName + " " + row.last_name}
          {(row.email?.endsWith("@test.com") ||
            row.email?.endsWith("@user.com")) && (
            <Tag color="geekblue">Test User</Tag>
          )}
          {row.trained && <Tag color="warning">{text.trained}</Tag>}
        </span>
      ),
    },
    {
      title: text.organisation,
      dataIndex: "organisation",
      render: (organisation) => organisation?.name || "-",
    },
    {
      title: text.email,
      dataIndex: "email",
    },
    {
      title: text.roleCol,
      dataIndex: "role",
      render: (role) => role?.value || "",
    },
    {
      title: text.regionCol,
      dataIndex: "administration",
      render: (administration) => {
        const adm = administration?.id
          ? window.dbadm.find((d) => d.id === administration.id)?.full_name
          : false;
        if (adm) {
          return reverse(adm.split("|")).join(", ");
        }
        return adm;
      },
    },
    {
      title: text.phoneCol,
      dataIndex: "phone_number",
      render: (phone_number) => (phone_number ? phone_number : "-"),
    },
    {
      title: text.formsCol,
      dataIndex: "forms",
      align: "center",
      render: (forms) => forms.length || "None",
    },
    {
      title: text.lastLoginCol,
      dataIndex: "last_login",
      align: "center",
      render: (last_login) =>
        last_login ? moment.unix(last_login).format("MMMM Do YYYY") : "-",
    },
    Table.EXPAND_COLUMN,
  ];
  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const handleDelete = () => {
    setDeleting(true);
    api
      .delete(`user/${deleteUser.id}`)
      .then(() => {
        setDataset(dataset.filter((d) => d.id !== deleteUser.id));
        setDeleteUser(false);
        setDeleting(false);
        notify({
          type: "success",
          message: text.successDeleted,
        });
      })
      .catch((err) => {
        const { status, data } = err.response;
        if (status === 409) {
          notify({
            type: "error",
            message: data?.message || text.userDeleteFail,
          });
        } else {
          notify({
            type: "error",
            message: text.userDeleteFail,
          });
        }
        setDeleting(false);
        console.error(err.response);
      });
  };

  const fetchData = useCallback(
    (query = null) => {
      if (isLoggedIn) {
        let url = `users?page=${currentPage}&pending=${
          pending ? "true" : "false"
        }`;
        if (selectedAdministration?.id) {
          url += `&administration=${selectedAdministration.id}`;
        }
        if (trained !== null && typeof trained !== "undefined") {
          url += `&trained=${trained ? "true" : "false"}`;
        }
        if (role) {
          url += `&role=${role}`;
        }
        if (organisation) {
          url += `&organisation=${organisation}`;
        }
        if (query) {
          url += `&search=${query}`;
        }
        setLoading(true);
        api
          .get(url)
          .then((res) => {
            setDataset(res.data.data);
            setTotalCount(res.data.total);
            setLoading(false);
          })
          .catch((err) => {
            notify({
              type: "error",
              message: text.usersLoadFail,
            });
            setLoading(false);
            console.error(err);
          });
      }
    },
    [
      trained,
      role,
      organisation,
      pending,
      currentPage,
      selectedAdministration,
      isLoggedIn,
      notify,
      text.usersLoadFail,
    ]
  );

  useEffect(() => {
    fetchData();
  }, [
    trained,
    role,
    organisation,
    pending,
    currentPage,
    selectedAdministration,
    isLoggedIn,
    fetchData,
  ]);

  return (
    <div id="users">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath(text)} />
          <DescriptionPanel
            description={
              <>
                {text.manageUserDesc}
                <ul>
                  <li>{text.manageUserCan1}</li>
                  <li>{text.manageUserCan2}</li>
                  <li>{text.manageUserCan3}</li>
                </ul>
              </>
            }
          />
        </Col>
      </Row>
      <UserTab
        tabBarExtraContent={
          <Link to="/user/add">
            <Button type="primary">{text.manageUserCan1}</Button>
          </Link>
        }
      />
      <UserFilters
        query={query}
        setQuery={setQuery}
        fetchData={fetchData}
        pending={pending}
        setPending={setPending}
        loading={loading}
      />
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
              `Results: ${range[0]} - ${range[1]} of ${total} users`,
          }}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <UserDetail
                record={record}
                setDeleteUser={setDeleteUser}
                deleting={deleting}
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
      </Card>
      <Modal
        visible={deleteUser}
        onCancel={() => setDeleteUser(null)}
        centered
        width="575px"
        footer={
          <Row justify="center" align="middle">
            <Col span={14}>
              <i>{text.deleteUserHint}</i>
            </Col>
            <Col span={10}>
              <Button
                className="light"
                disabled={deleting}
                onClick={() => {
                  setDeleteUser(null);
                }}
              >
                {text.cancel}
              </Button>
              <Button
                type="primary"
                danger
                loading={deleting}
                onClick={() => {
                  handleDelete();
                }}
              >
                {text.delete}
              </Button>
            </Col>
          </Row>
        }
        bodyStyle={{ textAlign: "center" }}
      >
        <p>{text.deleteUserTitle}</p>
        <br />
        <img src="/assets/user.svg" height="80" />
        <h2>
          {deleteUser?.first_name} {deleteUser?.last_name}
        </h2>
        <p>{text.deleteUserDesc}</p>
        <Table
          columns={[
            {
              title: text.locationsCol,
              dataIndex: "administration",
              render: (cell) => cell.name,
            },
            {
              title: text.credentialsCol,
              dataIndex: "role",
              render: (cell) => cell.value,
            },
          ]}
          dataSource={[deleteUser]}
          rowKey="id"
          pagination={false}
        />
        {/* Assosiation detail */}
        <Table
          title={() => text.userAssociations}
          columns={[
            {
              title: text.assosiationCol,
              dataIndex: "name",
            },
            {
              title: text.countCol,
              dataIndex: "count",
            },
          ]}
          dataSource={deleteUser?.assosiations || []}
          rowKey={`${deleteUser?.id}-assosiation`}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default React.memo(Users);
