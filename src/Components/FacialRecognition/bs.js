import React from "react";
import styled from "styled-components";
import cx from "classnames";

/* Wrapper */
export const Container = styled.div.attrs({ className: "container" })`
    margin-top: 1rem;
`;
export const Row = styled.div.attrs({ className: "row" })``;

export const Col = styled.div.attrs((props) => {
    return { className: props.className ? props.className : "col-sm-12" };
})``;

/* Form */
export const FormGroup = styled.div.attrs({ className: "form-group" })`
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    display: flex;
`;
export const FormSubTitle = styled.h4`
    font-weight: 700;
    color: #ffffff;
    background: gray;
    padding: 0.5rem;
    margin-top: 1rem;
`;

export const Label = styled.label`
    padding-top: 0.5rem;
    flex-basis: 8rem;
`;

export const Select = styled.select.attrs({
    className: "form-control form-control-sm",
})`
    flex: 1;
`;
export const Option = styled.option``;

export const Range = styled.input.attrs({
    type: "range",
    className: "form-control-range form-control-range-sm",
})`
    flex: 1;
`;
const RangeValue = styled.div`
    padding-top: 0.5rem;
    flex-basis: 2rem;
    text-align: right;
`;
/* Elements */
export const Title = styled.h3`
    font-size: 1.2rem;
    font-weight: 700;
    display: block;
    text-align: center;
`;
export const SubTitle = styled.h4`
    font-size: 0.8rem;
    font-weight: 500;
    display: block;
    text-align: center;
    color: gray;
`;

/* Buttons */
export const VTButton = styled.button.attrs((props) => {
    return { className: cx({ btn: true, "btn-sm": true, "btn-block": true, "btn-secondary": !props.isOn, "btn-primary": props.isOn }) };
})``;
export const VTButtonGroup = styled.div`
    margin: 0.5rem 0rem;
    ${VTButton} {
        margin: 0rem;
        border-radius: 0rem;
    }
    ${VTButton}:first-child {
        border-top-left-radius: 0.2rem;
        border-top-right-radius: 0.2rem;
    }
    ${VTButton}:last-child {
        border-bottom-left-radius: 0.2rem;
        border-bottom-right-radius: 0.2rem;
    }
`;

export const TButton = styled.button.attrs((props) => {
    return { className: cx({ btn: true, "btn-sm": true, "btn-block": true, "btn-secondary": !props.isOn, "btn-primary": props.isOn }) };
})``;

/* Custom Views */

export const SelectRow = (options) => {
    const onChange = (e) => {
        options && options.onChange && options.onChange(e.target.value);
    };

    return (
        <Row>
            <Col>
                <FormGroup>
                    <Label>{options.title}</Label>
                    <Select value={options.value} onChange={onChange.bind(this)}>
                        {options.items?.map((o) => (
                            <Option key={o} value={o}>
                                {o}
                            </Option>
                        ))}
                    </Select>
                </FormGroup>
            </Col>
        </Row>
    );
};

export const SelectRange = (options) => {
    const onChange = (e) => {
        options && options.onChange && options.onChange(e.target.value);
    };
    return (
        <Row>
            <Col>
                <FormGroup>
                    <Label>{options.title}</Label>
                    <Range min={options.min} max={options.max} step={options.step ? options.step : 0.1} value={options.value} onChange={onChange.bind(this)} />
                    <RangeValue>{options.value}</RangeValue>
                </FormGroup>
            </Col>
        </Row>
    );
};

export const SelectToggle = (options) => {
    const onClick = (e) => {
        options && options.onClick && options.onClick(e);
    };
    return (
        <Row>
            <Col>
                <FormGroup>
                    <TButton isOn={options.isOn} onClick={onClick.bind(this)}>
                        {options.title}
                    </TButton>
                </FormGroup>
            </Col>
        </Row>
    );
};
