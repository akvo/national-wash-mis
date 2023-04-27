import React, { useEffect, useState } from "react";
import { Webform } from "akvo-react-form";
import "akvo-react-form/dist/index.css";
import "./style.scss";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Space, Progress, Result, Button, notification } from "antd";
import { api, store } from "../../lib";
import { takeRight, pick } from "lodash";
import { PageLoader, Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";
import moment from "moment";
import { getTranslation } from "../../util";

const Forms = () => {
  const navigate = useNavigate();
  const { user: authUser } = store.useState((s) => s);
  const { formId } = useParams();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [submit, setSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "forms");

  const formType = window.forms.find(
    (x) => x.id === parseInt(formId)
  )?.type_text;

  const redirectToBatch =
    (formType === "National" && authUser.role.id === 2) ||
    (formType === "County" && authUser.role.id > 2);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title:
        authUser?.role?.value === "Data Entry Staff"
          ? authUser.name
          : "Manage Data",
      link:
        authUser?.role?.value === "Data Entry Staff"
          ? "/profile"
          : "/data/manage",
    },
    {
      title: forms.name,
    },
  ];

  const onFinish = (values) => {
    setSubmit(true);
    const questions = forms.question_group
      .map((x) => x.question)
      .flatMap((x) => x);
    const answers = Object.keys(values)
      .map((v) => {
        const question = questions.find((q) => q.id === parseInt(v));
        let val = values[v];
        if (val || val === 0) {
          val =
            question.type === "option"
              ? [val]
              : question.type === "geo"
              ? [val.lat, val.lng]
              : val;
          return {
            question: parseInt(v),
            type: question.type,
            value: val,
            meta: question.meta,
          };
        }
        return false;
      })
      .filter((x) => x);
    const names = answers
      .filter((x) => !["geo", "cascade"].includes(x.type) && x.meta)
      .map((x) => {
        return x.value;
      })
      .flatMap((x) => x)
      .join(" - ");
    const geo = answers.find((x) => x.type === "geo" && x.meta)?.value;
    const administration = answers.find(
      (x) => x.type === "cascade" && x.meta
    )?.value;
    const data = {
      data: {
        administration: administration
          ? takeRight(administration)[0]
          : authUser.administration.id,
        name: names.length
          ? names
          : `${authUser.administration.name} - ${moment().format("MMM YYYY")}`,
        geo: geo || null,
      },
      answer: answers
        .map((x) => {
          if (x.type === "cascade") {
            return { ...x, value: takeRight(x.value)?.[0] || null };
          }
          return x;
        })
        .map((x) => pick(x, ["question", "value"])),
    };
    api
      .post(`form-pending-data/${formId}`, data)
      .then(() => {
        setTimeout(() => {
          setShowSuccess(true);
        }, 3000);
      })
      .catch(() => {
        notification.error({
          message: text.errorSomething,
        });
      })
      .finally(() => {
        setTimeout(() => {
          setSubmit(false);
        }, 2000);
      });
  };

  const onFinishFailed = ({ errorFields }) => {
    if (errorFields.length) {
      notify({
        type: "error",
        message: text.errorMandatoryFields,
      });
    }
  };

  const onChange = ({ progress }) => {
    setPercentage(progress.toFixed(0));
  };

  useEffect(() => {
    if (formId && loading) {
      api.get(`/form/web/${formId}`).then((res) => {
        const questionGroups = res.data.question_group.map((qg) => {
          const questions = qg.question.map((q) => {
            let qVal = { ...q };
            if (q?.extra) {
              delete qVal.extra;
              qVal = {
                ...qVal,
                ...q.extra,
              };
              if (q.extra?.allowOther) {
                qVal = {
                  ...qVal,
                  allowOtherText: text.enterOther,
                };
              }
            }
            return qVal;
          });
          return {
            ...qg,
            question: questions,
          };
        });
        setForms({ ...res.data, question_group: questionGroups });
        setLoading(false);
      });
    }
  }, [formId, loading, text]);

  return (
    <div id="form">
      <Row justify="center" gutter={[16, 16]}>
        <Col span={24} className="webform">
          <Space>
            <Breadcrumbs
              pagePath={pagePath}
              description={
                <p>
                  {text.description1}
                  <br />
                  {text.description2}
                </p>
              }
            />
          </Space>
          <DescriptionPanel
            description={
              <p>
                {text.description1}
                <br />
                {text.description2}
              </p>
            }
          />
          {loading || !formId ? (
            <PageLoader message={text.fetchingForm} />
          ) : (
            !showSuccess && (
              <Webform
                forms={forms}
                onFinish={onFinish}
                onCompleteFailed={onFinishFailed}
                onChange={onChange}
                submitButtonSetting={{ loading: submit }}
                languagesDropdownSetting={{
                  showLanguageDropdown: false,
                  languageDropdownValue: activeLang,
                }}
              />
            )
          )}
          {(!loading || formId) && !showSuccess && (
            <Progress className="progress-bar" percent={percentage} />
          )}
          {!loading && showSuccess && (
            <Result
              status="success"
              title={text?.formSuccessTitle}
              subTitle={
                redirectToBatch
                  ? text?.formSuccessSubTitle
                  : text?.formSuccessSubTitleForAdmin
              }
              extra={[
                <Button
                  type="primary"
                  key="back-button"
                  onClick={() => setShowSuccess(false)}
                >
                  {text.addNew}
                </Button>,
                !redirectToBatch ? (
                  <Button
                    key="manage-button"
                    onClick={() => navigate("/data/manage")}
                  >
                    {text.backManageData}
                  </Button>
                ) : (
                  <Button
                    key="batch-button"
                    onClick={() => navigate("/data/submissions")}
                  >
                    {text.backBatch}
                  </Button>
                ),
              ]}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Forms;
