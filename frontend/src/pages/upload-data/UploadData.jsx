import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Checkbox,
  Button,
  Space,
  Select,
  Upload,
  Result,
} from "antd";
import { FileTextFilled } from "@ant-design/icons";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { AdministrationDropdown } from "../../components";
import { useNavigate } from "react-router-dom";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { snakeCase, takeRight } from "lodash";
import moment from "moment";
import { getTranslation } from "../../util";

const allowedFiles = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const { Option } = Select;
const { Dragger } = Upload;
const regExpFilename = /filename="(?<filename>.*)"/;
const pagePath = (text) => [
  {
    title: text.controlCenter,
    link: "/control-center",
  },
  {
    title: text.title,
  },
];
const UploadData = () => {
  const { forms, user, administration } = store.useState((state) => state);
  const [formId, setFormId] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "uploadData");
  const exportGenerate = () => {
    const adm_id = takeRight(administration, 1)[0]?.id;
    api
      .get(`download/generate?form_id=${formId}&administration_id=${adm_id}`)
      .then(() => {
        notify({
          type: "success",
          message: text.dataExportSuccess,
        });
        setLoading(false);
        navigate("/data/export");
      })
      .catch(() => {
        notify({
          type: "error",
          message: text.dataExportFail,
        });
        setLoading(false);
      });
  };

  const selectedAdministration = takeRight(administration, 1)[0]?.name;
  // Do not allow to bulk upload without selecting atleast one admin level
  const allowBulkUpload =
    formId && takeRight(administration, 1)[0]?.level !== 0;

  useEffect(() => {
    if (formId && selectedAdministration && user) {
      const date = moment().format("YYYYMMDD");
      setFileName(
        [date, formId, selectedAdministration, snakeCase(user.name)].join("-")
      );
    }
  }, [user, selectedAdministration, formId]);

  const onChange = (info) => {
    if (info.file?.status === "done") {
      notify({
        type: "success",
        message: text.fileUploadSuccess,
      });
      setUploading(false);
      // navigate("/data/submissions");
      setShowSuccess(true);
    } else if (info.file?.status === "error") {
      notify({
        type: "error",
        message: text.fileUploadFail,
      });
      setUploading(false);
    }
  };

  const uploadRequest = ({ file, onSuccess }) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    api
      .post(`upload/excel/${formId}`, formData)
      .then((res) => {
        onSuccess(res.data);
      })
      .catch(() => {
        notify({
          type: "error",
          message: text.fileUploadFail,
        });
        setUploading(false);
      });
  };

  const props = {
    name: fileName,
    multiple: false,
    maxCount: 1,
    showUploadList: false,
    accept: allowedFiles.join(","),
    disabled: !allowBulkUpload || !fileName || uploading,
    customRequest: uploadRequest,
    onChange: onChange,
  };

  const handleChange = (e) => {
    // check only for data entry role
    if (user.role.id === 4) {
      api.get(`form/check-approver/${e}`).then((res) => {
        if (!res.data.count) {
          notify({
            type: "error",
            message: text.bulkUploadNoApproverMessage,
          });
        } else {
          setFormId(e);
        }
      });
    } else {
      setFormId(e);
    }
  };

  const downloadTemplate = () => {
    setLoading(true);
    if (updateExisting) {
      exportGenerate();
    } else {
      api
        .get(`export/form/${formId}`, { responseType: "blob" })
        .then((res) => {
          const contentDispositionHeader = res.headers["content-disposition"];
          const filename = regExpFilename.exec(contentDispositionHeader)?.groups
            ?.filename;
          if (filename) {
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            setLoading(false);
          } else {
            notify({
              type: "error",
              message: text.templateFetchFail,
            });
            setLoading(false);
          }
        })
        .catch((e) => {
          console.error(e);
          notify({
            type: "error",
            message: text.templateFetchFail,
          });
          setLoading(false);
        });
    }
  };

  return (
    <div id="uploadData">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath(text)} />
          <DescriptionPanel
            description={
              <>
                {text.thisIsWhereYou}
                <ul>
                  <li>{text.uploadDataCan1}</li>
                  <li>{text.uploadDataCan2}</li>
                  <li>{text.uploadDataCan3}</li>
                </ul>
              </>
            }
          />
        </Col>
      </Row>
      <Divider />
      {!loading && showSuccess && (
        <Card
          style={{ padding: 0, minHeight: "40vh" }}
          bodyStyle={{ padding: 0 }}
        >
          <Result
            status="success"
            title={text?.formSuccessTitle}
            extra={[
              <p key="phar">{text.successDesc}</p>,
              <Divider key="divider" />,
              <Button
                type="primary"
                key="back-button"
                onClick={() => setShowSuccess(false)}
              >
                {text.uploadAnotherButton}
              </Button>,
              <Button key="page" onClick={() => navigate("/control-center")}>
                {text.BackToCc}
              </Button>,
            ]}
          />
        </Card>
      )}
      {!showSuccess && (
        <>
          <Row align="middle">
            <Checkbox
              id="updateExisting"
              checked={updateExisting}
              onChange={() => {
                setUpdateExisting(!updateExisting);
              }}
            >
              {text.updateExisting}
            </Checkbox>
          </Row>
          <Card
            style={{ padding: 0, minHeight: "40vh" }}
            bodyStyle={{ padding: 0 }}
          >
            <Space align="center" size={32}>
              <img src="/assets/data-download.svg" />
              <p>{text.templateDownloadHint}</p>
              <Select
                placeholder={`${text.selectForm}...`}
                onChange={handleChange}
              >
                {forms.map((f, fI) => (
                  <Option key={fI} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
              <Button
                loading={loading}
                type="primary"
                onClick={downloadTemplate}
              >
                {text.download}
              </Button>
            </Space>
            <Space align="center" size={32}>
              <img src="/assets/data-upload.svg" />
              <p>{text.uploadUrData}</p>
              <Select
                placeholder={`${text.selectForm}...`}
                value={formId}
                onChange={handleChange}
              >
                {forms.map((f, fI) => (
                  <Option key={fI} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
              <AdministrationDropdown />
            </Space>
            <div className="upload-wrap">
              <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <FileTextFilled style={{ color: "#707070" }} />
                </p>
                <p className="ant-upload-text">
                  {formId
                    ? uploading
                      ? text.uploading
                      : text.dropFile
                    : text.pleaseSelectFrom}
                </p>
                <Button disabled={!allowBulkUpload} loading={uploading}>
                  {text.browseComputer}
                </Button>
              </Dragger>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default React.memo(UploadData);
