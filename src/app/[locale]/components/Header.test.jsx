import { render, screen } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import Header from "./Header";
import { expect, it, describe, vi } from "vitest";
import "@testing-library/jest-dom";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    pathname: "/",
  }),
  usePathname: () => "/",
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key) => key,
}));

describe("Header", () => {
  it("muestra el logo y el título", () => {
    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    expect(screen.getByAltText("ILA Logo")).toBeInTheDocument();
    expect(screen.getByText(/tagline/i)).toBeInTheDocument(); // clave i18n
  });
});
