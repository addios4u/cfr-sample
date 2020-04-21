/* eslint "react-hooks/exhaustive-deps":"off", "react/jsx-no-target-blank":"off" */

import React, { Fragment, useEffect, useState, useRef } from "react";

import * as facemesh from "@tensorflow-models/facemesh";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import { version } from "@tensorflow/tfjs-backend-wasm/dist/version";
import { ScatterGL } from "scatter-gl";
import { TRIANGULATION } from "./TF.FaceMesh.Triangulation";

import { OptionContainer, MeshGl } from "../ui";
import { Title, Select, Option } from "../bs";
import { Container, SelectRow, SelectRange, SelectToggle } from "../bs";

// import { isMobile, drawPath } from "./TF.utils";
import { drawPath } from "./TF.utils";

tfjsWasm.setWasmPath(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${version}/dist/tfjs-backend-wasm.wasm`);

// const _MOBILE = isMobile();
// const _RENDER_POINT_CLOUD = _MOBILE === false;
const _RENDER_POINT_CLOUD = true;

const _BACKEND = ["wasm", "webgl", "cpu"];

const _STATE = {
    backend: "wasm",
    maxFaces: 1,
    triangulateMesh: true,
};
let _MODEL = null,
    _SMODEL = null;
let _GL = null;
let _SCATTER_GL_HAS_INITIALIZED = false;

let timer = null;
export default (props) => {
    const defaultTiming = () => {
        const t = props.timings?.filter((o) => o.default === true);
        return t && t.length > 0 ? t[0].interval : 100;
    };

    const [timing, setTiming] = useState(defaultTiming);
    const setOnTimingchange = (e) => {
        clearInterval(timer);
        timer = setInterval(onDetect, e.target.value);
        setTiming(e.target.value);
    };

    const canvas = useRef(null);

    if (_RENDER_POINT_CLOUD) {
        _STATE.renderPointcloud = true;
    }

    const onDraw = async (predictions) => {
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

        predictions.forEach((prediction) => {
            const keypoints = prediction.scaledMesh;

            if (_STATE.triangulateMesh) {
                for (let i = 0; i < TRIANGULATION.length / 3; i++) {
                    const points = [TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]].map((index) => keypoints[index]);

                    drawPath(c, points, true);
                }
            } else {
                for (let i = 0; i < keypoints.length; i++) {
                    const x = keypoints[i][0];
                    const y = keypoints[i][1];

                    c.beginPath();
                    c.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
                    c.fill();
                }
            }
        });

        props.detected && props.detected("MESH", predictions);
    };

    const onScatter = (predictions) => {
        if (_RENDER_POINT_CLOUD && _STATE.renderPointcloud && _GL !== null) {
            const pointsData = predictions.map((prediction) => {
                let scaledMesh = prediction.scaledMesh;
                return scaledMesh.map((point) => [-point[0], -point[1], -point[2]]);
            });

            let flattenedPointsData = [];
            for (let i = 0; i < pointsData.length; i++) {
                flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
            }
            const dataset = new ScatterGL.Dataset(flattenedPointsData);

            if (!_SCATTER_GL_HAS_INITIALIZED) {
                _GL.render(dataset);
            } else {
                _GL.updateDataset(dataset);
            }
            _SCATTER_GL_HAS_INITIALIZED = true;
        }
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

        try {
            const predictions = await _MODEL.estimateFaces(canvas.current);
            if (predictions.length > 0) {
                onDraw(predictions);
            }

            if (_SMODEL) {
                const scatter = await _SMODEL.estimateFaces(props.video);
                if (scatter.length > 0) {
                    onScatter(scatter);
                }
            }
        } catch (e) {}
    };

    useEffect(() => {
        facemesh.load({ maxFaces: _STATE.maxFaces }).then((model) => {
            _MODEL = model;
            timer = setInterval(onDetect, timing);
        });
        facemesh.load({ maxFaces: _STATE.maxFaces }).then((model) => {
            _SMODEL = model;
            _GL = new ScatterGL(document.querySelector("#scatter-gl-mesh"), { rotateOnStart: false, selectEnabled: false });
        });
        return () => {
            if (timer) {
                clearInterval(timer);
            }
            _SCATTER_GL_HAS_INITIALIZED = false;
        };
    }, []);

    const onStateChange = () => {
        facemesh.load({ maxFaces: _STATE.maxFaces }).then((model) => {
            _MODEL = model;
            timer = setInterval(onDetect, timing);
        });
        facemesh.load({ maxFaces: _STATE.maxFaces }).then((model) => {
            _SMODEL = model;
            _SCATTER_GL_HAS_INITIALIZED = false;
            _GL = new ScatterGL(document.querySelector("#scatter-gl-mesh"), { rotateOnStart: false, selectEnabled: false });
        });
    };

    return (
        <Fragment>
            <canvas ref={canvas} width={props.width} height={props.height} style={{ display: "none" }} />
            <MeshGl {...props} id="scatter-gl-mesh" />
            <OptionContainer {...props} style={{ width: 350 }}>
                <Title>
                    TF = Face Mesh
                    <small>
                        [
                        <a href="https://github.com/tensorflow/tfjs-models/tree/master/facemesh" target="_blank">
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

                <OptionStates onChange={onStateChange.bind(this)} />
            </OptionContainer>
        </Fragment>
    );
};

const OptionStates = (props) => {
    // algorithm
    const [backend, setBackend] = useState(_STATE.backend);
    const onBackendChange = (value) => {
        _STATE.backend = value;
        setBackend(value);
        props.onChange && props.onChange();
    };

    // maxFaces
    const [maxFaces, setMaxFaces] = useState(_STATE.maxFaces);
    const onMaxFacesChange = (value) => {
        _STATE.maxFaces = value;
        setMaxFaces(value);
        props.onChange && props.onChange();
    };

    // triangulateMesh
    const [triangulateMesh, setTriangulateMesh] = useState(_STATE.triangulateMesh);
    const onTriangulateMeshClick = () => {
        _STATE.triangulateMesh = !_STATE.triangulateMesh;
        setTriangulateMesh(_STATE.triangulateMesh);
        props.onChange && props.onChange();
    };

    // renderPointcloud
    const [renderPointcloud, setRenderPointcloud] = useState(_STATE.renderPointcloud);
    const onRenderPointcloudClick = () => {
        _STATE.renderPointcloud = !_STATE.renderPointcloud;
        setRenderPointcloud(_STATE.renderPointcloud);
        props.onChange && props.onChange();
    };

    return (
        <Container>
            <SelectRow title="backend" items={_BACKEND} value={backend} onChange={onBackendChange.bind(this)} />
            <SelectRange title="maxFaces" min={1} max={20} step={1} value={maxFaces} onChange={onMaxFacesChange.bind(this)} />
            <SelectToggle title="triangulateMesh" isOn={triangulateMesh} onClick={onTriangulateMeshClick.bind(this)} />
            <SelectToggle title="renderPointcloud" isOn={renderPointcloud} onClick={onRenderPointcloudClick.bind(this)} />
        </Container>
    );
};
