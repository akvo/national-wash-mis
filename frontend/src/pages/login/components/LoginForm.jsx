import React, { useState } from "react";
import { Form, Input, Button, notification } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { api, store, config } from "../../../lib";
import { useNotification } from "../../../util/hooks";
import { reloadData } from "../../../util/form";
import { getTranslation } from "../../../util";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "login");

  const onFinish = (values) => {
    setLoading(true);
    api
      .post("login", {
        email: values.email,
        password: values.password,
      })
      .then((res) => {
        api.setToken(res.data.token);
        const role_details = config
          .roles()
          .find((r) => r.id === res.data.role.id);
        const designation = config.designations.find(
          (d) => d.id === parseInt(res.data?.designation)
        );
        if (
          res.data.forms.length === 0 &&
          role_details.name !== "Super Admin"
        ) {
          notification.open({
            message: text.contactAdmin,
            description: text.formAssignmentError,
          });
        }
        store.update((s) => {
          s.isLoggedIn = true;
          s.selectedForm = null;
          s.user = {
            ...res.data,
            role_detail: role_details,
            designation: designation,
          };
        });
        reloadData(res.data);
        setLoading(false);
        navigate("/control-center");
      })
      .catch((err) => {
        if (err.response.status === 401 || err.response.status === 400) {
          setLoading(false);
          notify({
            type: "error",
            message: err.response?.data?.message,
          });
        }
      });
  };

  return (
    <Form
      name="login-form"
      layout="vertical"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="email"
        label={text.emailLabel}
        rules={[
          {
            required: true,
            message: text.usernameRequired,
          },
        ]}
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder={text.email}
        />
      </Form.Item>
      <Form.Item
        name="password"
        label={text.passwordLabel}
        disabled={loading}
        rules={[
          {
            required: true,
            message: text.passwordRequired,
          },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          disabled={loading}
          placeholder={text.passwordLabel}
        />
      </Form.Item>
      <Form.Item>
        <Link className="login-form-forgot" to="/forgot-password">
          {text.forgotPasswordLink}
        </Link>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {text.loginBtn}
        </Button>
      </Form.Item>
      <p className="disclaimer">{text.accountDisclaimer}</p>
    </Form>
  );
};

export default LoginForm;
