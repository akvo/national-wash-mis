import React from "react";
import "./style.scss";
import { Row, Col, Space, Button } from "antd";
import AdministrationDropdown from "./AdministrationDropdown";
import RemoveFiltersButton from "./RemoveFiltersButton";

const ApproverFilters = ({ loading, disabled, visible, reset, save, text }) => {
  return (
    <Row>
      <Col flex={1}>
        <Space>
          <AdministrationDropdown loading={loading} />
          <RemoveFiltersButton />
        </Space>
      </Col>
      <Col>
        {visible ? (
          <Row justify="end">
            <Col>
              <Space size={6}>
                <Button className="light" disabled={disabled} onClick={reset}>
                  {text.reset}
                </Button>
                <Button
                  type="primary"
                  disabled={disabled}
                  onClick={save}
                  loading={loading}
                >
                  {text.save}
                </Button>
              </Space>
            </Col>
          </Row>
        ) : (
          ""
        )}
      </Col>
    </Row>
  );
};

export default React.memo(ApproverFilters);
