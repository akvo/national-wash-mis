import React, { useState } from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdministrationDropdown from "./AdministrationDropdown";
import FormDropdown from "./FormDropdown.js";
import { useNotification } from "../../util/hooks";
import { api, store } from "../../lib";
import { takeRight } from "lodash";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdvancedFiltersButton from "./AdvancedFiltersButton";
import AdvancedFilters from "./AdvancedFilters";
import { getTranslation } from "../../util";

const DataFilters = ({ loading }) => {
  const {
    user: authUser,
    selectedForm,
    loadingForm,
    administration,
    showAdvancedFilters,
    language,
  } = store.useState((s) => s);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [exporting, setExporting] = useState(false);
  const isUserHasForms = authUser?.forms ? authUser.forms.length : false;
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "controlCenter");

  const exportGenerate = () => {
    setExporting(true);
    const adm_id = takeRight(administration, 1)[0]?.id;
    api
      .get(
        `download/generate?form_id=${selectedForm}&administration_id=${adm_id}`
      )
      .then(() => {
        notify({
          type: "success",
          message: text.successExport,
        });
        setExporting(false);
        navigate("/data/export");
      })
      .catch(() => {
        notify({
          type: "error",
          message: text.errorExport,
        });
        setExporting(false);
      });
  };
  return (
    <>
      <Row>
        <Col flex={1}>
          <Space>
            <FormDropdown loading={loading} />
            <AdministrationDropdown loading={loading || loadingForm} />
            <RemoveFiltersButton />
            <AdvancedFiltersButton />
          </Space>
        </Col>
        {["Super Admin", "County Admin", "Data Entry Staff"].includes(
          authUser?.role?.value
        ) && (
          <Col>
            <Space>
              {pathname === "/data/manage" && (
                <Button
                  type="primary"
                  onClick={exportGenerate}
                  loading={exporting}
                >
                  {text.dataDownloadButton}
                </Button>
              )}
              <Link to="/data/upload">
                <Button type="primary">{text.bulkUpload}</Button>
              </Link>
              <Link to={`/form/${selectedForm}`}>
                <Button
                  type="primary"
                  disabled={
                    !isUserHasForms && authUser?.role?.value !== "Super Admin"
                  }
                >
                  {text.addNew}
                </Button>
              </Link>
            </Space>
          </Col>
        )}
      </Row>
      {showAdvancedFilters && <AdvancedFilters />}
    </>
  );
};

export default React.memo(DataFilters);
