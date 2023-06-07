import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";
import { getTranslation } from "../../../util";

const ProfileTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "tour");
  const permalinks = config.permalinks;

  const steps = [
    {
      image: "/assets/tour/profile/1.png",
      title: text.controlCenter,
      description: text.tourControlCenter,
    },
    ...(config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/profile/2.png",
            title: text.tourDataUploadsTitle,
            description: text.tourDataUploads,
            url: permalinks.tourDataUploads,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/profile/3.png",
            title: text.tourSubmittingTitle,
            description: text.tourSubmitting,
            url: permalinks.tourSubmitting,
          },
          {
            image: "/assets/tour/profile/4.png",
            title: text.tourApprovalTitle,
            description: text.tourApproval,
            url: permalinks.tourApproval,
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ProfileTour);
