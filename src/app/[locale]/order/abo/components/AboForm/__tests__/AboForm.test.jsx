import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AboForm from "../AboForm";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key) => key;
    t.raw = (key) => key;
    return t;
  },
}));

// Los componentes hijos complejos no son relevantes para estos tests
vi.mock("../GiftSelector", () => ({ default: () => null }));
vi.mock("../TermsCheckboxes", () => ({ default: () => null }));
vi.mock("../../PromoForm/PromoGiftSection", () => ({
  default: () => null,
  PromoBanner: () => null,
}));

// Mock del fetch (llamada al banner en useEffect)
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue([]),
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AboForm — visibilidad condicional", () => {
  it("muestra el card de regalo por defecto (tipo NORMAL)", () => {
    render(<AboForm gifts={[]} />);
    expect(screen.getByText("giftQuestion")).toBeInTheDocument();
  });

  it("oculta el card de regalo al seleccionar TRIAL", () => {
    render(<AboForm gifts={[]} />);
    fireEvent.click(screen.getByText("trialName"));
    expect(screen.queryByText("giftQuestion")).not.toBeInTheDocument();
  });

  it("vuelve a mostrar el card de regalo al cambiar de TRIAL a NORMAL", () => {
    render(<AboForm gifts={[]} />);
    fireEvent.click(screen.getByText("trialName"));
    fireEvent.click(screen.getByText("normalName"));
    expect(screen.getByText("giftQuestion")).toBeInTheDocument();
  });

  it("muestra el InfoBox de NORMAL al cargar el formulario", () => {
    render(<AboForm gifts={[]} />);
    expect(screen.getByText("details.normal.info")).toBeInTheDocument();
  });

  it("muestra el card de Förderabo al seleccionar SUPPORTER", () => {
    render(<AboForm gifts={[]} />);
    fireEvent.click(screen.getByText("supporterName"));
    expect(screen.getByText("details.supporter.intro")).toBeInTheDocument();
  });

  it("muestra el InfoBox de REDUCED al seleccionar Ermäßigtes Abo", () => {
    render(<AboForm gifts={[]} />);
    fireEvent.click(screen.getByText("reducedName"));
    expect(screen.getByText("details.reduced.info")).toBeInTheDocument();
  });

  it("muestra las opciones de variante al seleccionar TRIAL", () => {
    render(<AboForm gifts={[]} />);
    fireEvent.click(screen.getByText("trialName"));
    expect(screen.getByText("details.trial.variantNormal")).toBeInTheDocument();
    expect(screen.getByText("details.trial.variantReduced")).toBeInTheDocument();
  });
});

describe("AboForm — validación de donación (SUPPORTER)", () => {
  function renderAndOpenDonation() {
    render(<AboForm gifts={[]} />);
    fireEvent.click(screen.getByText("supporterName"));
    fireEvent.click(screen.getByText("details.supporter.adjustToggle"));
  }

  it("muestra error cuando la donación es menor a 10€", () => {
    renderAndOpenDonation();
    fireEvent.change(screen.getByPlaceholderText("10"), {
      target: { value: "5" },
    });
    expect(
      screen.getByText("details.supporter.amountMinError")
    ).toBeInTheDocument();
  });

  it("no muestra error cuando la donación es exactamente 10€", () => {
    renderAndOpenDonation();
    fireEvent.change(screen.getByPlaceholderText("10"), {
      target: { value: "10" },
    });
    expect(
      screen.queryByText("details.supporter.amountMinError")
    ).not.toBeInTheDocument();
  });

  it("muestra error cuando el valor no es un número entero", () => {
    renderAndOpenDonation();
    fireEvent.change(screen.getByPlaceholderText("10"), {
      target: { value: "abc" },
    });
    expect(
      screen.getByText("details.supporter.amountInteger")
    ).toBeInTheDocument();
  });

  it("limpia el error al vaciar el campo", () => {
    renderAndOpenDonation();
    fireEvent.change(screen.getByPlaceholderText("10"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByPlaceholderText("10"), {
      target: { value: "" },
    });
    expect(
      screen.queryByText("details.supporter.amountMinError")
    ).not.toBeInTheDocument();
  });
});
