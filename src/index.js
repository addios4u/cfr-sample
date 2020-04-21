import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";

import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.css";

import GlobalStyles from "./Components/ui/GlobalStyles";
import App from "./App";

ReactGA.initialize("UA-164168836-1");

ReactDOM.render(
    <React.StrictMode>
        <App />
        <GlobalStyles />
    </React.StrictMode>,
    document.getElementById("root")
);
