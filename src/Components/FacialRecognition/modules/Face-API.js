/* eslint "react-hooks/exhaustive-deps":"off", "react/jsx-no-target-blank":"off" */

import React, { Fragment, useEffect, useState, useRef } from "react";
import { OptionContainer } from "../ui";
import { Title, Select, Option, VTButtonGroup, VTButton } from "../bs";
import * as faceapi from "face-api.js";

let timer = null;
let _IS_DETECTIONS = true,
    _IS_LANDMARKS = true,
    _IS_EXPRESSIONS = true;
export default (props) => {
    const defaultTiming = () => {
        const t = props.timings?.filter((o) => o.default === true);
        return t && t.length > 0 ? t[0].interval : 100;
    };

    const size = { width: props.width, height: props.height };
    const canvas = useRef(null);

    const [timing, setTiming] = useState(defaultTiming);
    const setOnTimingchange = (e) => {
        clearInterval(timer);
        timer = setInterval(onDetect, e.target.value);
        setTiming(e.target.value);
    };

    const [isDetections, setIsDetections] = useState(_IS_DETECTIONS);
    const [isLandmarks, setIsLandmarks] = useState(_IS_LANDMARKS);
    const [isExpressions, setIsExpressions] = useState(_IS_EXPRESSIONS);
    const toggleIsDetection = () => {
        _IS_DETECTIONS = !_IS_DETECTIONS;
        setIsDetections(_IS_DETECTIONS);
    };
    const toggleIsLandmarks = () => {
        _IS_LANDMARKS = !_IS_LANDMARKS;
        setIsLandmarks(_IS_LANDMARKS);
    };
    const toggleIsExpressions = () => {
        _IS_EXPRESSIONS = !_IS_EXPRESSIONS;
        setIsExpressions(_IS_EXPRESSIONS);
    };

    const onDraw = async (detections) => {
        if (!props.canvas || !props.video) {
            return;
        }

        const canvas = props.canvas;
        const { width, height } = canvas;
        const c = canvas.getContext("2d");

        c.save();
        c.scale(-1, 1);
        c.translate(-width, 0);
        c.clearRect(0, 0, width, height);
        c.restore();

        _IS_DETECTIONS && faceapi.draw.drawDetections(canvas, detections);
        _IS_LANDMARKS && faceapi.draw.drawFaceLandmarks(canvas, detections);
        _IS_EXPRESSIONS && faceapi.draw.drawFaceExpressions(canvas, detections);

        props.detected && props.detected("FACE", detections);
    };

    const onDetect = async () => {
        if (!canvas || !props.video) {
            return;
        }

        const { width, height } = canvas.current;
        const c = canvas.current.getContext("2d");
        c.save();
        c.scale(-1, 1);
        c.translate(-width, 0);
        c.drawImage(props.video, 0, 0, width, height);
        c.restore();

        const detections = await faceapi.detectAllFaces(canvas.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, size);
        onDraw(resizedDetections);
    };

    useEffect(() => {
        Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models"), faceapi.nets.faceLandmark68Net.loadFromUri("/models"), faceapi.nets.faceRecognitionNet.loadFromUri("/models"), faceapi.nets.faceExpressionNet.loadFromUri("/models")]).then(() => {
            faceapi.matchDimensions(props.canvas, size);
            timer = setInterval(onDetect, timing);
        });

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, []);

    return (
        <Fragment>
            <canvas ref={canvas} width={props.width} height={props.height} style={{ display: "none" }} />
            <OptionContainer {...props}>
                <Title>
                    Face-API{" "}
                    <small>
                        [
                        <a href="https://github.com/justadudewhohacks/face-api.js/" target="_blank">
                            Link
                        </a>
                        ]
                    </small>
                </Title>
                {props.timings && (
                    <Select onChange={setOnTimingchange.bind(this)} value={timing}>
                        {props.timings.map((o) => (
                            <Option key={o.interval} value={o.interval}>
                                {o.title}
                            </Option>
                        ))}
                    </Select>
                )}
                <VTButtonGroup>
                    <VTButton isOn={isDetections} onClick={toggleIsDetection.bind(this)}>
                        Detections
                    </VTButton>
                    <VTButton isOn={isLandmarks} onClick={toggleIsLandmarks.bind(this)}>
                        Landmarks
                    </VTButton>
                    <VTButton isOn={isExpressions} onClick={toggleIsExpressions.bind(this)}>
                        Expressions
                    </VTButton>
                </VTButtonGroup>
            </OptionContainer>
        </Fragment>
    );
};
