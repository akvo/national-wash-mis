import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";
import { getTranslation } from "../../../util";

const ControlCenterTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "tour");
  const permalinks = config.permalinks;
  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/control-center/1.png",
            title: text.tourManageDataTitle,
            description: text.tourManageData,
            url: permalinks.tourManageData,
          },
          {
            image: "/assets/tour/control-center/2.png",
            title: text.tourExportsTitle,
            description: text.tourExports,
            url: permalinks.tourExports,
          },
        ]
      : []),
    ...(authUser?.role_id !== 4 &&
    config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/control-center/3.png",
            title: text.tourDataUploadsTitle,
            description: text.tourDataUploads,
            url: permalinks.tourDataUploads,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/control-center/4.png",
            title: text.tourUserMngTitle,
            description: text.tourUserManagement,
            url: permalinks.tourUserManagementData,
          },
        ]
      : []),
    ...(authUser?.role_id === 4 ||
    config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/control-center/5.png",
            title: text.tourValidationSetupTitle,
            description: text.tourValidationSetup,
            url: permalinks.tourValidationSetup,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/control-center/6.png",
            title: text.tourSubmittingTitle,
            description: text.tourSubmitting,
            url: permalinks.tourSubmitting,
          },
          {
            image: "/assets/tour/control-center/7.png",
            title: text.tourApprovalTitle,
            description: text.tourApproval,
            url: permalinks.tourApproval,
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ControlCenterTour);
