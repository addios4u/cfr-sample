import React from "react";
import { isMobile } from "react-device-detect";

import { AppWrapper } from "./Components/ui/Wrappers";
import { CFR } from "./Components/FacialRecognition";

const getDimension = (width, height) => {
    if (width > height) {
        return {
            width: (height * 3) / 4,
            height: height - 15,
        };
    } else if (height > width) {
        return {
            width: width - 15,
            height: (width * 3) / 4,
        };
    } else {
        return { width, height };
    }
};

export default (props) => {
    const detected = (type, detections) => {};

    const { innerWidth, innerHeight } = window;
    const dSize = getDimension(innerWidth, innerHeight);

    return (
        <AppWrapper>
            <CFR width={isMobile ? dSize.width : 720} height={isMobile ? dSize.height : 540} detected={detected.bind(this)} type="FACE" />
        </AppWrapper>
    );
};
