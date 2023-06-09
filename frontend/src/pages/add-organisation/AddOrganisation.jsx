import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Form, Button, Divider, Input, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { api, store, config } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";
import { getTranslation } from "../../util";

const { Option } = Select;

const AddOrganisation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { organisationAttributes } = config;
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const text = getTranslation(activeLang, "organisationForm");

  const pagePath = [
    {
      title: text.settings,
      link: "/settings",
    },
    {
      title: text.manageOrganisations,
      link: "/organisations",
    },
    {
      title: id ? text.editOrganisation : text.addOrganisation,
    },
  ];

  const onFinish = (values) => {
    setSubmitting(true);
    const payload = {
      name: values.name,
      attributes: values.attributes,
    };
    api[id ? "put" : "post"](
      id ? `organisation/${id}` : "organisation",
      payload
    )
      .then(() => {
        notify({
          type: "success",
          message: id ? text?.successUpdated : text?.successAdded,
        });
        setSubmitting(false);
        navigate("/organisations");
      })
      .catch((err) => {
        notify({
          type: "error",
          message:
            err?.response?.data?.message || id
              ? text?.errorUpdated
              : text?.errorAdded,
        });
        setSubmitting(false);
      });
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`organisation/${id}`).then((res) => {
        form.setFieldsValue({
          name: res.data.name,
          attributes: res.data.attributes.map((a) => a.type_id),
        });
        setLoading(false);
      });
    }
  }, [id, form]);

  return (
    <div id="add-organisation">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={<p>{text?.descriptionData}</p>} />
        </Col>
      </Row>
      <Divider />
      <Form
        name="user-form"
        form={form}
        layout="vertical"
        initialValues={{
          name: "",
          attributes: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="name"
                label={text?.name}
                rules={[
                  {
                    required: true,
                    message: text.valOrgName,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <div className="form-row">
            <Form.Item
              name="attributes"
              label={text?.attributes}
              rules={[{ required: true, message: text.valOrgAttributes }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder={text.selectAttributes}
                mode="multiple"
                allowClear
                loading={!organisationAttributes()?.length || loading}
              >
                {organisationAttributes(text)?.map((o, oi) => (
                  <Option key={`org-attr-${oi}`} value={o.id}>
                    {o.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {id ? text.updateOrganisation : text.addOrganisation}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default React.memo(AddOrganisation);
