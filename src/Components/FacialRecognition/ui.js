import styled from "styled-components";
import cx from "classnames";

const _DEFAULT_WIDTH = 480;
const _DEFAULT_HEIGHT = 360;

const getPXSizeByProps = (size, def) => {
    if (!size) {
        return `${def}px`;
    }
    if (!Number.isNaN(size)) {
        return `${size}px`;
    }
    return size;
};

export const Container = styled.div`
    position: relative;
    display: block;
    margin: 0 auto;
    border: ${(props) => (props.debug ? "black dashed 2px" : "none")};
    width: ${(props) => getPXSizeByProps(props.width + (props.debug ? 4 : 0), _DEFAULT_WIDTH)};
    height: ${(props) => getPXSizeByProps(props.height + (props.debug ? 4 : 0), _DEFAULT_HEIGHT)};
    text-align: center;
`;

export const StatsContainer = styled.div`
    position: absolute;
    right: 0px;
    top: 0px;
`;

export const OptionContainer = styled.div`
    border: ${(props) => (props.debug ? "#00ff00 dashed 2px" : "none")};
    padding: 5px;
    position: absolute;
    top: 0px;
    left: ${(props) => props.width + (props.debug ? 4 : 0) + 10}px;
    min-width: 200px;

    @media (max-width: 768px) {
        position: relative;
        top: 0px;
        left: 0px;
        margin-top: 1rem;
        width: 100% !important;
    }
`;

/* Menu */
export const MenuContainer = styled.div.attrs({ className: "btn-group" })`
    position: relative;
    margin: 1rem 0rem;
    width: ${(props) => getPXSizeByProps(props.width, _DEFAULT_WIDTH)};
    text-align: center;
`;

export const MenuItem = styled.button.attrs((props) => {
    return {
        className: cx({ btn: true, "btn-sm": true, "btn-secondary": !props.isOn, "btn-primary": props.isOn }),
    };
})``;

/* Camera */
export const CameraContainer = styled.div`
    position: relative;
    margin: 0 auto;
    width: ${(props) => getPXSizeByProps(props.width, _DEFAULT_WIDTH)};
    height: ${(props) => getPXSizeByProps(props.height, _DEFAULT_HEIGHT)};
    display: inline-block;
`;
export const Camera = styled.video.attrs((props) => {
    return { width: props.width ? props.width : _DEFAULT_WIDTH, height: props.height ? props.height : _DEFAULT_HEIGHT };
})`
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
`;
export const CameraError = styled.div`
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    display: flex;
    font-weight: 700;
    font-size: 2em;
    i {
        margin-right: 0.5em;
    }
`;

/* Canvas */
export const Canvas = styled.canvas.attrs((props) => {
    return { width: props.width ? props.width : _DEFAULT_WIDTH, height: props.height ? props.height : _DEFAULT_HEIGHT };
})`
    position: absolute;
    left: 0px;
    top: 0px;
`;

/* ETC */
export const MeshGl = styled.div`
    position: relative;
    margin-top: 1rem;
    width: ${(props) => getPXSizeByProps(props.width, _DEFAULT_WIDTH)};
    height: ${(props) => getPXSizeByProps(props.height, _DEFAULT_HEIGHT)};
    canvas {
        transform: translate3d(-50%, -50%, 0);
        left: 50%;
        top: 50%;
        position: absolute;
    }
`;
