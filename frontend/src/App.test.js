import { render, screen } from "@testing-library/react";
import TestApp from "./TestApp";
import "@testing-library/jest-dom";
import { store } from "./lib";

beforeAll(() => {
  store.update((s) => {
    s.language = {
      ...s.language,
      active: "en",
    };
  });
  window.translations = {
    en: {
      page: {
        header: {
          signOut: "Sign Out",
          dashboards: "Dashboards",
          reports: "Reports",
          newsEvents: "News & Events",
          login: "Log in",
          newDashboard: "New Dashboard",
          households: "Households",
        },
      },
    },
  };
});

describe("App", () => {
  test("test if the login button exists", () => {
    render(<TestApp />);
    const linkElement = screen.getByText(/Log In/i);
    expect(linkElement).toBeInTheDocument();
  });
});
