import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import TestApp from "../../../TestApp";
import "@testing-library/jest-dom";
import { loginTrans } from "./translation";

jest.mock("axios");

beforeAll(() => {
  window.translations = { ...loginTrans };
});

describe("Login and Registration", () => {
  test("test if the login form exists", () => {
    const { asFragment } = render(<TestApp />);
    userEvent.click(screen.getByText(/Connexion/i), { button: 0 });
    expect(screen.getByText(/Content de te revoir/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Veuillez saisir les détails de votre compte/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/Mot de passe oublié/i)).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot("LoginPage");
  });

  test("test if the registration form exists", async () => {
    const fakeUser = {
      name: "John Doe",
      invite: "abcd",
    };
    axios.mockResolvedValue({ status: 200, data: fakeUser });

    // let registrationPage;
    await act(async () => {
      // registrationPage = render(<TestApp entryPoint={"/login/abcd"} />);
      render(<TestApp entryPoint={"/login/abcd"} />);
      expect(screen.getByText(/non/i)).toBeInTheDocument();
    });

    const welcome = screen.getByTestId("welcome-title");
    expect(welcome.textContent).toBe(
      `Bienvenue sur PDHA, ${fakeUser.name}Veuillez définir votre mot de passe pour la plate-forme.Votre mot de passe doit inclure:`
    );

    expect(screen.getByText(/Confirmez le mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Definir un nouveau mot de passe/i)
    ).toBeInTheDocument();
    // expect(registrationPage.asFragment()).toMatchSnapshot("RegistrationPage");
  });
});
