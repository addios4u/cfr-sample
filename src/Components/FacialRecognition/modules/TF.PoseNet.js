/* eslint "react-hooks/exhaustive-deps":"off", "react/jsx-no-target-blank":"off" */

import React, { Fragment, useEffect, useState, useRef } from "react";
import * as posenet from "@tensorflow-models/posenet";

import { isMobile, drawKeypoints, drawSkeleton, drawBoundingBox } from "./TF.utils";

import { OptionContainer } from "../ui";

import { Title, SubTitle } from "../bs";
import { Container, SelectRow, SelectRange, SelectToggle } from "../bs";
import { FormSubTitle, Select, Option } from "../bs";

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = isMobile() ? 0.5 : 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInputResolution = 500;

const defaultResNetMultiplier = 1.0;
const defaultResNetStride = 32;
const defaultResNetInputResolution = 250;

const _ALGORITHM = ["single-pose", "multi-pose"];
const _ARCHITECTURE = ["MobileNetV1", "ResNet50"];
const _INPUT_RESOLUTION = [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800];
const _QUANTBYTES = [1, 2, 4];

const _STATE = {
    algorithm: "multi-pose",
    input: {
        architecture: "MobileNetV1",
        outputStride: defaultMobileNetStride,
        inputResolution: defaultMobileNetInputResolution,
        multiplier: defaultMobileNetMultiplier,
        quantBytes: defaultQuantBytes,
    },
    singlePoseDetection: {
        minPoseConfidence: 0.1,
        minPartConfidence: 0.5,
    },
    multiPoseDetection: {
        maxPoseDetections: 5,
        minPoseConfidence: 0.15,
        minPartConfidence: 0.1,
        nmsRadius: 30.0,
    },
    output: {
        showVideo: true,
        showSkeleton: true,
        showPoints: true,
        showBoundingBox: false,
    },
    net: null,
};

let timer = null;
export default (props) => {
    const defaultTiming = () => {
        const t = props.timings?.filter((o) => o.default === true);
        return t && t.length > 0 ? t[0].interval : 100;
    };

    const canvas = useRef(null);

    const [timing, setTiming] = useState(defaultTiming);
    const setOnTimingchange = (e) => {
        clearInterval(timer);
        timer = setInterval(onDetect, e.target.value);
        setTiming(e.target.value);
    };

    const onDraw = async (poses, minPoseConfidence, minPartConfidence) => {
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

        poses.forEach(({ score, keypoints }) => {
            if (score >= minPoseConfidence) {
                if (_STATE.output.showPoints) {
                    drawKeypoints(keypoints, minPartConfidence, c);
                }
                if (_STATE.output.showSkeleton) {
                    drawSkeleton(keypoints, minPartConfidence, c);
                }
                if (_STATE.output.showBoundingBox) {
                    drawBoundingBox(keypoints, c);
                }
            }
        });

        props.detected && props.detected("POSE", poses);
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

        const flipPoseHorizontal = false;

        let poses = [];
        let minPoseConfidence;
        let minPartConfidence;

        if (!_STATE.net) {
            return;
        }

        switch (_STATE.algorithm) {
            case "single-pose":
                const pose = await _STATE.net.estimatePoses(canvas.current, {
                    flipHorizontal: flipPoseHorizontal,
                    decodingMethod: "single-person",
                });
                poses = poses.concat(pose);
                minPoseConfidence = +_STATE.singlePoseDetection.minPoseConfidence;
                minPartConfidence = +_STATE.singlePoseDetection.minPartConfidence;
                break;
            case "multi-pose":
                let all_poses = await _STATE.net.estimatePoses(canvas.current, {
                    flipHorizontal: flipPoseHorizontal,
                    decodingMethod: "multi-person",
                    maxDetections: _STATE.multiPoseDetection.maxPoseDetections,
                    scoreThreshold: _STATE.multiPoseDetection.minPartConfidence,
                    nmsRadius: _STATE.multiPoseDetection.nmsRadius,
                });

                poses = poses.concat(all_poses);
                minPoseConfidence = +_STATE.multiPoseDetection.minPoseConfidence;
                minPartConfidence = +_STATE.multiPoseDetection.minPartConfidence;
                break;
            default:
                break;
        }

        onDraw(poses, minPoseConfidence, minPartConfidence);
    };

    useEffect(() => {
        posenet
            .load({
                architecture: _STATE.input.architecture,
                outputStride: _STATE.input.outputStride,
                inputResolution: _STATE.input.inputResolution,
                multiplier: _STATE.input.multiplier,
                quantBytes: _STATE.input.quantBytes,
            })
            .then((net) => {
                _STATE.net = net;
                timer = setInterval(onDetect, timing);
            });

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, []);

    const onStateChange = () => {
        posenet
            .load({
                architecture: _STATE.input.architecture,
                outputStride: _STATE.input.outputStride,
                inputResolution: _STATE.input.inputResolution,
                multiplier: _STATE.input.multiplier,
                quantBytes: _STATE.input.quantBytes,
            })
            .then((net) => {
                _STATE.net = net;
            });
    };

    return (
        <Fragment>
            <canvas ref={canvas} width={props.width} height={props.height} style={{ display: "none" }} />

            <OptionContainer {...props} style={{ width: 350 }}>
                <Title>
                    TF = PoseNet
                    <small>
                        [
                        <a href="https://github.com/tensorflow/tfjs-models/tree/master/posenet" target="_blank">
                            Link
                        </a>
                        ]
                    </small>
                </Title>
                <SubTitle>ResNet50</SubTitle>
                {props.timings && (
                    <Select onChange={setOnTimingchange.bind(this)} value={timing}>
                        {props.timings.map((o) => (
                            <Option key={o.interval} value={o.interval}>
                                {o.title}
                            </Option>
                        ))}
                    </Select>
                )}
                <OptionStates onChange={onStateChange.bind(this)} />
            </OptionContainer>
        </Fragment>
    );
};

const OptionStates = (props) => {
    // algorithm
    const [algorithm, setAlgorithm] = useState(_STATE.algorithm);
    const onAlgorithmChange = (value) => {
        _STATE.algorithm = value;
        setAlgorithm(value);
        props.onChange && props.onChange();
    };

    // architecture
    const [architecture, setArchitecture] = useState(_STATE.input.architecture);
    const onArchitectureChange = (value) => {
        _STATE.input.architecture = value;
        switch (value) {
            case "MobileNetV1":
                _STATE.input.outputStride = defaultMobileNetStride;
                _STATE.input.inputResolution = defaultMobileNetInputResolution;
                _STATE.input.multiplier = defaultMobileNetMultiplier;
                break;
            case "ResNet50":
                _STATE.input.outputStride = defaultResNetStride;
                _STATE.input.inputResolution = defaultResNetInputResolution;
                _STATE.input.multiplier = defaultResNetMultiplier;
                break;
            default:
                break;
        }
        setArchitecture(value);
        setInputResolution(_STATE.input.inputResolution);
        setOutputStride(_STATE.input.outputStride);
        setMultiplier(_STATE.input.multiplier);
        props.onChange && props.onChange();
    };

    // inputResolution
    const [inputResolution, setInputResolution] = useState(_STATE.input.inputResolution);
    const onInputResolutionChange = (value) => {
        _STATE.input.inputResolution = parseInt(value);
        setInputResolution(parseInt(value));
        props.onChange && props.onChange();
    };

    // outputStride
    const getOutputStride = (a) => {
        switch (a) {
            case "MobileNetV1":
                return [8, 16];
            case "ResNet50":
                return [16, 32];
            default:
                return [];
        }
    };
    const [outputStrides, setOutputStrides] = useState(getOutputStride(_STATE.input.architecture));
    const [outputStride, setOutputStride] = useState(_STATE.input.outputStride);
    const onOutputStride = (value) => {
        _STATE.input.outputStride = parseInt(value);
        setOutputStride(parseInt(value));
        props.onChange && props.onChange();
    };

    // multiplier
    const getMultiplier = (a) => {
        switch (a) {
            case "MobileNetV1":
                return [1, 0.5, 0.75];
            case "ResNet50":
                return [1];
            default:
                return [];
        }
    };
    const [multipliers, setMultipliers] = useState(getMultiplier(_STATE.input.architecture));
    const [multiplier, setMultiplier] = useState(_STATE.input.multiplier);
    const onMultiplier = (value) => {
        _STATE.input.multiplier = value;
        setMultiplier(value);
        props.onChange && props.onChange();
    };

    // quantBytes
    const [quantBytes, setQuantBytes] = useState(_STATE.input.quantBytes);
    const onQuantBytes = (value) => {
        _STATE.input.quantBytes = parseInt(value);
        setQuantBytes(parseInt(value));
        props.onChange && props.onChange();
    };

    // Single - minPoseConfidence
    const [sMinPoseConfidence, setSMinPoseConfidence] = useState(_STATE.singlePoseDetection.minPoseConfidence);
    const onSMinPoseConfidence = (value) => {
        _STATE.singlePoseDetection.minPoseConfidence = value;
        setSMinPoseConfidence(value);
        props.onChange && props.onChange();
    };
    // Single - minPartConfidence
    const [sMinPartConfidence, setSMinPartConfidence] = useState(_STATE.singlePoseDetection.minPartConfidence);
    const onSMinPartConfidence = (value) => {
        _STATE.singlePoseDetection.minPartConfidence = value;
        setSMinPartConfidence(value);
        props.onChange && props.onChange();
    };

    // Multi - maxPoseDetections
    const [mMaxPoseDetections, setMMaxPoseDetections] = useState(_STATE.multiPoseDetection.maxPoseDetections);
    const onMMaxPoseDetections = (value) => {
        _STATE.multiPoseDetection.maxPoseDetections = value;
        setMMaxPoseDetections(value);
        props.onChange && props.onChange();
    };
    // Multi - minPoseConfidence
    const [mMinPoseConfidence, setMMinPoseConfidence] = useState(_STATE.multiPoseDetection.minPoseConfidence);
    const onMMinPoseConfidence = (value) => {
        _STATE.multiPoseDetection.minPoseConfidence = value;
        setMMinPoseConfidence(value);
        props.onChange && props.onChange();
    };
    // Multi - minPartConfidence
    const [mMinPartConfidence, setMMinPartConfidence] = useState(_STATE.multiPoseDetection.minPartConfidence);
    const onMMinPartConfidence = (value) => {
        _STATE.multiPoseDetection.minPartConfidence = value;
        setMMinPartConfidence(value);
        props.onChange && props.onChange();
    };
    // Multi - nmsRadius
    const [mNmsRadius, setMNmsRadius] = useState(_STATE.multiPoseDetection.nmsRadius);
    const onMNmsRadius = (value) => {
        _STATE.multiPoseDetection.nmsRadius = value;
        setMNmsRadius(value);
        props.onChange && props.onChange();
    };

    // showSkeleton
    const [showSkeleton, setShowSkeleton] = useState(_STATE.output.showSkeleton);
    const onShowSkeleton = () => {
        _STATE.output.showSkeleton = !_STATE.output.showSkeleton;
        setShowSkeleton(_STATE.output.showSkeleton);
        props.onChange && props.onChange();
    };

    // showPoints
    const [showPoints, setShowPoints] = useState(_STATE.output.showPoints);
    const onShowPoints = () => {
        _STATE.output.showPoints = !_STATE.output.showPoints;
        setShowPoints(_STATE.output.showPoints);
        props.onChange && props.onChange();
    };

    // showBoundingBox
    const [showBoundingBox, setShowBoundingBox] = useState(_STATE.output.showBoundingBox);
    const onShowBoundingBox = () => {
        _STATE.output.showBoundingBox = !_STATE.output.showBoundingBox;
        setShowBoundingBox(_STATE.output.showBoundingBox);
        props.onChange && props.onChange();
    };

    useEffect(() => {
        setOutputStrides(getOutputStride(_STATE.input.architecture));
        setMultipliers(getMultiplier(_STATE.input.architecture));
    }, [architecture]);

    return (
        <Container>
            <SelectRow title="algorithm" items={_ALGORITHM} value={algorithm} onChange={onAlgorithmChange.bind(this)} />
            <FormSubTitle>Input</FormSubTitle>
            <SelectRow title="architecture" items={_ARCHITECTURE} value={architecture} onChange={onArchitectureChange.bind(this)} />
            <SelectRow title="inputResolution" items={_INPUT_RESOLUTION} value={inputResolution} onChange={onInputResolutionChange.bind(this)} />
            <SelectRow title="outputStride" items={outputStrides} value={outputStride} onChange={onOutputStride.bind(this)} />
            <SelectRow title="multiplier" items={multipliers} value={multiplier} onChange={onMultiplier.bind(this)} />
            <SelectRow title="quantBytes" items={_QUANTBYTES} value={quantBytes} onChange={onQuantBytes.bind(this)} />
            <FormSubTitle>Single Pose Detection</FormSubTitle>
            <SelectRange title="minPoseConfidence" min={0.0} max={1.0} value={sMinPoseConfidence} onChange={onSMinPoseConfidence.bind(this)} />
            <SelectRange title="minPartConfidence" min={0.0} max={1.0} value={sMinPartConfidence} onChange={onSMinPartConfidence.bind(this)} />
            <FormSubTitle>Multi Pose Detection</FormSubTitle>
            <SelectRange title="maxPoseDetections" min={1} max={20} step={1} value={mMaxPoseDetections} onChange={onMMaxPoseDetections.bind(this)} />
            <SelectRange title="minPoseConfidence" min={0.0} max={1.0} value={mMinPoseConfidence} onChange={onMMinPoseConfidence.bind(this)} />
            <SelectRange title="minPartConfidence" min={0.0} max={1.0} value={mMinPartConfidence} onChange={onMMinPartConfidence.bind(this)} />
            <SelectRange title="nmsRadius" min={0.0} max={40.0} value={mNmsRadius} onChange={onMNmsRadius.bind(this)} />
            <FormSubTitle>Output</FormSubTitle>
            <SelectToggle title="showSkeleton" isOn={showSkeleton} onClick={onShowSkeleton.bind(this)} />
            <SelectToggle title="showPoints" isOn={showPoints} onClick={onShowPoints.bind(this)} />
            <SelectToggle title="showBoundingBox" isOn={showBoundingBox} onClick={onShowBoundingBox.bind(this)} />
        </Container>
    );
};
