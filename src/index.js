import React from "react";
import ReactDOM from "react-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.css";

import GlobalStyles from "./Components/ui/GlobalStyles";
import App from "./App";

ReactDOM.render(
    <React.StrictMode>
        <App />
        <GlobalStyles />
    </React.StrictMode>,
    document.getElementById("root")
);
