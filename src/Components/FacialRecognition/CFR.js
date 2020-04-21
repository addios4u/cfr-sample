/* eslint "react-hooks/exhaustive-deps":"off" */

import React, { useEffect, useRef, useState } from "react";
import swal from "sweetalert";
import Stats from "react-canvas-stats";
import ReactGA from "react-ga";
import { isMobile } from "react-device-detect";

import { Container, CameraContainer, Camera, CameraError, Canvas } from "./ui";
import { MenuContainer, MenuItem, StatsContainer } from "./ui";

import { CFRFace, CFRPose, CFRFaceMesh } from "./modules";

export const TYPES = [
    { code: "NONE", title: "NONE", default: true },
    { code: "FACE", title: "face-api.js", default: false },
    { code: "POSE", title: "TF : posenet", default: false },
    { code: "MESH", title: "TF : facemesh", default: false },
];
export const TIMING = [
    { interval: 10, title: "0.01 초", default: false },
    { interval: 30, title: "0.03 초", default: false },
    { interval: 50, title: "0.05 초", default: false },
    { interval: 70, title: "0.07 초", default: false },
    { interval: 100, title: "0.1 초", default: true },
    { interval: 300, title: "0.3 초", default: false },
    { interval: 500, title: "0.5 초", default: false },
    { interval: 700, title: "0.7 초", default: false },
    { interval: 1000, title: "1 초", default: false },
    { interval: 2000, title: "2 초", default: false },
    { interval: 3000, title: "3 초", default: false },
    { interval: 5000, title: "5 초", default: false },
    { interval: 7000, title: "7 초", default: false },
    { interval: 10000, title: "10 초", default: false },
];

const getDefaultType = () => {
    const t = TYPES.filter((o) => o.default === true);
    return t[0].code;
};

const _MEMORY = window.performance && window.performance.memory;
const _EXTRA_PANELS = _MEMORY
    ? [
          {
              name: "MB",
              fg: "#f08",
              bg: "#201",
              maxValue: _MEMORY.jsHeapSizeLimit / 1048576, //you have to provide this for scale
              updateOnType: "fps", //this feels a bit clunky, there are two update types
              updateCallback: (val) => _MEMORY.usedJSHeapSize / 1048576, //a function to transform the value (you dont have to you can also just compute whatever you want), val input val output
          },
      ]
    : null;

ReactGA.initialize("UA-164168836-1");
ReactGA.pageview("/root");

export default (props) => {
    const video = useRef(null);
    const canvas = useRef(null);
    const fps = useRef(null);

    const [hasCamera, setHasCamera] = useState(null);
    const [type, setType] = useState(props.type || getDefaultType());

    const [width, setWidth] = useState(isMobile ? null : props.width);
    const [height, setHeight] = useState(isMobile ? null : props.height);

    const onTypeChanged = (t) => {
        ReactGA.event({ category: t, action: "Change View", label: t });
        setType(t);
    };

    const initCamera = () => {
        try {
            navigator.getUserMedia(
                {
                    video: {
                        width: props.width,
                        height: props.height,
                    },
                    audio: false,
                },
                (stream) => {
                    const track = stream.getTracks()[0];
                    if (isMobile) {
                        const { width, height } = track.getSettings();
                        const { orientation } = window.screen;
                        if (orientation.type.startsWith("portrait")) {
                            setWidth(height);
                            setHeight(width);
                        } else {
                            setWidth(width);
                            setHeight(height);
                        }
                    }

                    video.current.srcObject = stream;
                    video.current.play();
                    setHasCamera(true);
                },
                (e) => {
                    swal(e.message).then(() => {
                        setHasCamera(false);
                    });
                }
            );
        } catch (e) {
            swal({ title: "크롬을 이용해 주세요.", text: e.message });
        }
    };

    const clearCanvas = () => {
        if (!canvas || !canvas.current) {
            return;
        }
        const { width, height } = canvas.current;
        const c = canvas.current.getContext("2d");
        c.save();
        c.clearRect(0, 0, width, height);
        c.restore();
    };

    useEffect(() => {
        initCamera();
    }, []);

    useEffect(() => {
        setTimeout(clearCanvas, 10);
    }, [type]);

    const onDetected = (type, detections) => {
        fps && fps.current.refresh();

        props.detected && props.detected(type, detections);
    };

    return (
        <Container {...props}>
            {props.isMenu !== false && <Menu {...props} type={type} onChange={onTypeChanged.bind(this)} />}

            <CameraContainer {...props}>
                {hasCamera === false && (
                    <CameraError>
                        <i className="fa fa-exclamation-triangle"></i>Not Found Camera
                    </CameraError>
                )}
                <Camera {...props} ref={video} width={width} height={height} />
                {width && height && <Canvas {...props} ref={canvas} width={width} height={height} style={{ display: type === "NONE" ? "none" : "block" }} />}
            </CameraContainer>

            {hasCamera && type === "FACE" && <CFRFace {...props} video={video?.current} canvas={canvas?.current} detected={onDetected} timings={TIMING} />}
            {hasCamera && type === "POSE" && <CFRPose {...props} video={video?.current} canvas={canvas?.current} detected={onDetected} timings={TIMING} />}
            {hasCamera && type === "MESH" && <CFRFaceMesh {...props} video={video?.current} canvas={canvas?.current} detected={onDetected} timings={TIMING} />}

            {_MEMORY && <FPSStats ref={fps} {...props} />}
        </Container>
    );
};

const Menu = (props) => {
    return (
        <MenuContainer {...props}>
            {TYPES.map((t) => (
                <MenuItem
                    key={t.code}
                    isOn={props.type === t.code}
                    onClick={() => {
                        props.onChange && props.onChange(t.code);
                    }}
                >
                    {t.title}
                </MenuItem>
            ))}
        </MenuContainer>
    );
};

class FPSStats extends React.Component {
    constructor(props) {
        super(props);
        this.state = { timestamp: Date.now() };
    }

    refresh = () => {
        this.setState({ timestamp: Date.now() });
    };

    render() {
        if (!this.props.debug) {
            return null;
        }
        return (
            <StatsContainer>
                <Stats timestamp={this.state.timestamp} extraPanels={_EXTRA_PANELS} />
            </StatsContainer>
        );
    }
}
