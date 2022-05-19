import "./App.scss";
import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import {
  Home,
  Login,
  ControlCenter,
  Users,
  AddUser,
  Forms,
  ManageData,
  Questionnaires,
  QuestionnairesAdmin,
  Approvals,
  ApproversTree,
  Profile,
  ExportData,
  UploadData,
  Visualisation,
  NewsEvents,
  HowWeWork,
  Terms,
  Privacy,
} from "./pages";
import { useCookies } from "react-cookie";
import { store, api, config } from "./lib";
import { Layout, PageLoader } from "./components";
import { useNotification } from "./util/hooks";
import { timeDiffHours } from "./util/date";

const Private = ({ element: Element, alias }) => {
  const { user: authUser } = store.useState((state) => state);
  if (authUser) {
    const page_access = authUser?.role_detail?.page_access;
    return page_access.includes(alias) ? (
      <Element />
    ) : (
      <Navigate to="/not-found" />
    );
  }
  return <Navigate to="/login" />;
};

const RouteList = () => {
  return (
    <Routes>
      <Route exact path="/" element={<Home />} />
      <Route exact path="/login" element={<Login />} />
      <Route exact path="/login/:invitationId" element={<Login />} />
      <Route exact path="/forgot-password" element={<Login />} />
      <Route exact path="/data" element={<Home />} />
      <Route exact path="/form/:formId" element={<Forms />} />
      <Route path="/users" element={<Private element={Users} alias="user" />} />
      <Route
        path="/user/add"
        element={<Private element={AddUser} alias="user" />}
      />
      <Route
        path="/user/:id"
        element={<Private element={AddUser} alias="user" />}
      />
      <Route
        path="/control-center"
        element={<Private element={ControlCenter} alias="control-center" />}
      />
      <Route
        path="/data/manage"
        element={<Private element={ManageData} alias="data" />}
      />
      <Route
        path="/data/export"
        element={<Private element={ExportData} alias="data" />}
      />
      <Route
        path="/data/upload"
        element={<Private element={UploadData} alias="data" />}
      />
      <Route
        path="/data/visualisation"
        element={<Private element={Visualisation} alias="visualisation" />}
      />
      <Route
        path="/questionnaires"
        element={<Private element={Questionnaires} alias="questionnaires" />}
      />
      <Route
        path="/questionnaires/admin"
        element={
          <Private element={QuestionnairesAdmin} alias="questionnaires" />
        }
      />
      <Route
        path="/approvals"
        element={<Private element={Approvals} alias="approvals" />}
      />
      <Route
        path="/approvers/tree"
        element={<Private element={ApproversTree} alias="approvers" />}
      />
      <Route
        path="/profile"
        element={<Private element={Profile} alias="profile" />}
      />
      <Route path="/news-events" element={<NewsEvents />} />
      <Route path="/how-we-work" element={<HowWeWork />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route exact path="/coming-soon" element={<div />} />
      <Route exact path="/not-found" element={<div />} />
      <Route path="*" element={<Navigate replace to="/not-found" />} />
    </Routes>
  );
};

const App = () => {
  const { user: authUser, isLoggedIn } = store.useState((state) => state);
  const [cookies, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  document.addEventListener("click", () => {
    if (isLoggedIn && authUser?.last_login) {
      const expired = timeDiffHours(authUser.last_login);
      if (expired >= 2) {
        removeCookie("AUTH_TOKEN");
        store.update((s) => {
          s.isLoggedIn = false;
          s.user = null;
        });
      }
    }
  });

  useEffect(() => {
    if (!location.pathname.includes("/login")) {
      if (!authUser && !isLoggedIn && cookies && !!cookies.AUTH_TOKEN) {
        api
          .get("profile", {
            headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
          })
          .then((res) => {
            const role_details = config.roles.find(
              (r) => r.id === res.data.role.id
            );
            store.update((s) => {
              s.isLoggedIn = true;
              s.user = { ...res.data, role_detail: role_details };
              s.forms = role_details.filter_form
                ? window.forms.filter(
                    (x) => x.type === role_details.filter_form
                  )
                : role_details.id === 2
                ? window.forms.filter((x) =>
                    res.data.forms.map((f) => f.id).includes(x.id)
                  )
                : window.forms;
            });
            api.setToken(cookies.AUTH_TOKEN);
            setLoading(false);
          })
          .catch((err) => {
            if (err.response.status === 401) {
              notify({
                type: "error",
                message: "Your session has expired",
              });
              removeCookie("AUTH_TOKEN");
              store.update((s) => {
                s.isLoggedIn = false;
                s.user = null;
              });
            }
            setLoading(false);
            console.error(err);
          });
      } else if (!cookies.AUTH_TOKEN) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [authUser, isLoggedIn, removeCookie, cookies, notify]);

  useEffect(() => {
    if (isLoggedIn) {
      api
        .get(`administration/${authUser.administration.id}`)
        .then((adminRes) => {
          store.update((s) => {
            s.administration = [
              {
                id: adminRes.data.id,
                name: adminRes.data.name,
                levelName: adminRes.data.level_name,
                children: adminRes.data.children,
                childLevelName: adminRes.data.children_level_name,
              },
            ];
          });
        })
        .catch((err) => {
          notify({
            type: "error",
            message: "Could not load filters",
          });
          store.update((s) => {
            s.loadingAdministration = false;
          });
          console.error(err);
        });
    }
  }, [authUser, isLoggedIn, notify]);

  return (
    <Layout>
      <Layout.Header />
      <Layout.Banner />
      <Layout.Body>
        {loading ? (
          <PageLoader message="Initializing. Please wait.." />
        ) : (
          <RouteList />
        )}
      </Layout.Body>
      <Layout.Footer />
    </Layout>
  );
};

export default App;
