import reset from "react-style-reset";
import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
    ${reset}
    body {
        font-size:14px;
    }
`;
