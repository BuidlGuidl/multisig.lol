import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import React from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { BrowserRouter } from "react-router-dom";
// import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { SafeInjectProvider } from "./contexts/SafeInjectContext";
import { createRoot } from "react-dom/client";

const themes = {
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
};

const prevTheme = window.localStorage.getItem("theme");

const subgraphUri = "http://localhost:8000/subgraphs/name/scaffold-eth/your-contract";

const client = new ApolloClient({
  uri: subgraphUri,
  cache: new InMemoryCache(),
});

// react 18 adjustments
const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <ApolloProvider client={client}>
    <ThemeSwitcherProvider themeMap={themes} defaultTheme={prevTheme || "light"}>
      <BrowserRouter>
        <SafeInjectProvider>
          <App subgraphUri={subgraphUri} />
        </SafeInjectProvider>
      </BrowserRouter>
    </ThemeSwitcherProvider>
  </ApolloProvider>,
);
